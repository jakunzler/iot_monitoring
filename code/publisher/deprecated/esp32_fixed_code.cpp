// Código corrigido para ESP32 - Função sendDataToServer
bool sendDataToServer(float temperature, float humidity) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Obter timestamp Unix real
  unsigned long currentTime = 0;
  if (timeClient.connected()) {
    currentTime = timeClient.getEpochTime();
  } else {
    // Fallback: usar millis() + timestamp de referência
    // Você precisa definir um timestamp de referência quando o ESP32 iniciar
    currentTime = referenceTimestamp + (millis() / 1000);
  }
  
  // Criar JSON
  StaticJsonDocument<300> doc;
  doc["device_id"] = "ESP32-DHT22-Publisher";
  doc["timestamp"] = currentTime;  // ✅ Timestamp Unix correto
  doc["sensor"] = "dht22";
  doc["reading_number"] = totalReadings;
  
  JsonObject data = doc.createNestedObject("data");
  data["temperature"] = temperature;
  data["humidity"] = humidity;
  data["temperature_f"] = temperature * 9.0 / 5.0 + 32.0;
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["wifi_rssi"] = WiFi.RSSI();
  metadata["wifi_ip"] = WiFi.localIP().toString();
  metadata["uptime_seconds"] = millis() / 1000;  // ✅ Uptime separado do timestamp
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Enviar requisição
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    http.end();
    return httpResponseCode == 200;
  } else {
    http.end();
    return false;
  }
}
