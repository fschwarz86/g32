var net = require('net');
const mqtt = require('mqtt');

const host = '[MQTT SERVER]';
const port = '1883';
const mqttUsername = '[MQTT USERNAME]';
const mqttPassword = '[MQTT PASSWORD]';
const mqttTopic = '/outdoor/g32';
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const grillSerialNumber = '[G32 SERIAL NUMBER]';

//do something when app is closing
process.on('exit', function() {
    client.destroy();
    mqttClient.end();
});

//catches ctrl+c event
process.on('SIGINT', function() { 
    client.destroy();
    mqttClient.end();
});

const connectUrl = `mqtt://${host}:${port}`
const mqttClient = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: mqttUsername,
  password: mqttPassword,
  reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
  console.log('MQTT Connected');
});

var client = new net.Socket();
// client.setTimeout(5000);
client.connect(4502, 'socket.ottowildeapp.com', function() {
    client.write('{"channel":"LISTEN_TO_GRILL","data":{"grillSerialNumber":"' + grillSerialNumber.toLowerCase() + '"}}');
});

client.on('connect', function() {
    console.log('G32 Connected');
    client.on('data', function(data) {
	    var bindata = data.toString('binary');
	    var hexdata = Buffer.from(bindata, 'ascii').toString('hex');

        var t1 = parseData(hexdata[12] + hexdata[13], hexdata[14] + hexdata[15]);
	    var t2 = parseData(hexdata[16] + hexdata[17], hexdata[18] + hexdata[19]);
	    var t3 = parseData(hexdata[20] + hexdata[21], hexdata[22] + hexdata[23]);
	    var t4 = parseData(hexdata[24] + hexdata[25], hexdata[26] + hexdata[27]);
	    
        var ex1 = parseData(hexdata[28] + hexdata[29], hexdata[30] + hexdata[31]);
	    var ex2 = parseData(hexdata[32] + hexdata[33], hexdata[34] + hexdata[35]);
	    var ex3 = parseData(hexdata[36] + hexdata[37], hexdata[38] + hexdata[39]);
	    var ex4 = parseData(hexdata[40] + hexdata[41], hexdata[42] + hexdata[43]);

        var w = ((parseInt(hexdata[44] + hexdata[45] + hexdata[46] + hexdata[47], 16) - 4192) - 10400) / 11000;
	    
	    var status = {'t1': t1, 't2': t2, 't3': t3, 't4': t4, 'ex1': ex1, 'ex2': ex2, 'ex3': ex3, 'ex4': ex4, 'w': w};
	    
	    mqttClient.publish(mqttTopic, JSON.stringify(status), {qos: 0, retain: false});
    });
	    
    client.on('error', function(err) {
        if (err.code == "ENOTFOUND") {
            console.log("[ERROR] No device found at this address!");
            client.destroy();
            return;
        }

        if (err.code == "ECONNREFUSED") {
            console.log("[ERROR] Connection refused! Please check the IP.");
            client.destroy();
            return;
        }
    });
    
    client.on('timeout', function() {
        console.log("[ERROR] Connection timed out.");
        client.destroy();
    });
    
    client.on('end', function() {
        client.destroy();
    });
});

function parseData(highByte, lowByte) {
    var value = parseInt(highByte, 16) * 10 + parseInt(lowByte, 16) / 10;
    if (value == '1500') {
	    value = "n/a";
    }
    return value;
}
