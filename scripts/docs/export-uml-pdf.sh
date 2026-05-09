#!/usr/bin/env bash
# Gera PDFs a partir dos diagramas PlantUML em docs/uml/{pt,en,es} usando Docker.
# 1) PlantUML → SVG (por idioma em docs/dist/svg/<lang>/)
# 2) rsvg-convert → PDF por diagrama
# 3) pdfunite → um PDF combinado por idioma (opcional)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SVG_DIR="${ROOT}/docs/dist/svg"
PDF_DIR="${ROOT}/docs/dist/pdf"
COMBINED_BASENAME="iot-monitoring-uml-combined.pdf"

PLANTUML_IMAGE="${PLANTUML_IMAGE:-plantuml/plantuml:latest}"
ALPINE_IMAGE="${ALPINE_IMAGE:-alpine:3.20}"

# Pastas de origem: docs/uml/pt, docs/uml/en, docs/uml/es
UML_LANGS=(pt en es)

require_docker() {
  if ! command -v docker &>/dev/null; then
    echo "Erro: Docker é necessário para gerar os PDFs. Instale Docker ou use uma IDE com PlantUML." >&2
    exit 1
  fi
}

run_plantuml_svg() {
  local lang
  for lang in "${UML_LANGS[@]}"; do
    mkdir -p "${SVG_DIR}/${lang}"
    shopt -s nullglob
    local host_files=( "${ROOT}/docs/uml/${lang}"/*.puml )
    if ((${#host_files[@]} == 0)); then
      echo "Nenhum .puml em ${ROOT}/docs/uml/${lang}" >&2
      exit 1
    fi
    local container_paths=()
    local f
    for f in "${host_files[@]}"; do
      container_paths+=( "/work/docs/uml/${lang}/$(basename "$f")" )
    done
    echo "→ PlantUML (SVG) [${lang}]…"
    docker run --rm \
      -u "$(id -u):$(id -g)" \
      -v "${ROOT}:/work" \
      -w /work \
      "$PLANTUML_IMAGE" \
      -tsvg -o "/work/docs/dist/svg/${lang}" \
      "${container_paths[@]}"
  done
}

run_svg_to_pdf() {
  mkdir -p "$PDF_DIR"
  docker run --rm \
    -v "${ROOT}:/work" \
    -w /work \
    "$ALPINE_IMAGE" \
    sh -c "
      apk add --no-cache rsvg-convert poppler-utils >/dev/null
      for lang in pt en es; do
        mkdir -p /work/docs/dist/pdf/\$lang
        for svg in /work/docs/dist/svg/\$lang/*.svg; do
          [ -f \"\$svg\" ] || continue
          base=\$(basename \"\$svg\" .svg)
          rsvg-convert -f pdf -o \"/work/docs/dist/pdf/\$lang/\${base}.pdf\" \"\$svg\"
        done
      done
      chown $(id -u):$(id -g) /work/docs/dist/pdf/*/*.pdf 2>/dev/null || true
    "
}

run_combine() {
  local _combined_base="$COMBINED_BASENAME"
  local lang
  for lang in "${UML_LANGS[@]}"; do
    docker run --rm \
      -v "${ROOT}:/work" \
      "$ALPINE_IMAGE" \
      sh -c "
        apk add --no-cache poppler-utils >/dev/null
        d=/work/docs/dist/pdf/${lang}
        out=\$d/${_combined_base}
        rm -f \"\$out\"
        inputs=\"\"
        for f in \$d/*.pdf; do
          case \"\$f\" in
            *combined.pdf) continue ;;
          esac
          [ -f \"\$f\" ] || continue
          inputs=\"\$inputs \$f\"
        done
        set -- \$inputs
        if [ \"\$#\" -eq 0 ]; then
          echo \"Nenhum PDF individual para unir (${lang})\" >&2
          exit 1
        fi
        pdfunite \"\$@\" \"\$out\"
        chown $(id -u):$(id -g) \"\$out\" 2>/dev/null || true
      "
    echo "  PDF unificado [${lang}]: ${PDF_DIR}/${lang}/${_combined_base}"
  done
}

usage() {
  echo "Uso: $(basename "$0") [--no-combine]"
  echo "  Gera docs/dist/pdf/<lang>/<diagrama>.pdf e, por padrão, um PDF combinado por idioma (pt, en, es)."
}

main() {
  local combine=1
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --no-combine) combine=0; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "Argumento desconhecido: $1" >&2; usage; exit 1 ;;
    esac
  done

  require_docker
  run_plantuml_svg
  echo "→ SVG → PDF…"
  run_svg_to_pdf
  if [[ "$combine" -eq 1 ]]; then
    echo "→ Unindo PDFs por idioma…"
    run_combine
    echo "Pronto."
  else
    echo "Pronto: PDFs individuais em ${PDF_DIR}/{pt,en,es}/"
  fi
}

main "$@"
