# G32 API Reverse Engineering

By default, the sensor information generated by an [OttoWilde G32 Connected](https://www.ottowildegrillers.com/products/g32-connected) are only available via iOS/Android app. In order to access the information from other clients, such as [Home Assistant](https://hass.io), the content needs to be made available in other formats.

## API Parts

The API consists of 4 (?) endpoints of which 3 are available as a REST API and 1 (the core data endpoint) is a raw TCP socket.

### App Login

URL: https://mobile-api.ottowildeapp.com/login

The login service requires username and password and returns an Auth-Token.

POST Request:

    {
       "email": "[EMAIL]",
       "password": "[PASSWORD]"
    }

Response:

    {
       "data": {
           "accessToken": "[TOKEN]",
           "refreshToken": "[TOKEN]",
           "user": {
               "birthday": null,
               "city": null,
               "contentNotifications": 0,
               "countryId": null,
               "description": null,
               "email": "[EMAIL]",
               "facebookId": null,
               "grillNotifications": 0,
               "id": [ID],
               "language": "DE",
               "measurementSystem": "METRIC",
               "name": "[NAME]",
               "phoneNumber": null,
               "postalCode": null,
               "profilePicture": null,
               "role": "USER",
               "streetName": null,
               "surname": "[SURNAME]",
               "tsCreated": "[TIMESTAMP]",
               "tsLastModified": "[TIMESTAMP]"
           }
       }
    }

Example

`curl -X POST -H "Content-Type: application/json; charset=utf-8" --data '{"email": "[EMAIL]", "password": "[PASSWORD]"}' "https://mobile-api.ottowildeapp.com/login"`

### Grill Information

URL: https://mobile-api.ottowildeapp.com/v2/grills

The grills service returns information about the registered grills and requires the Auth-Token from the login service in the header of the GET request.

GET Request:

    authorization: [TOKEN]
    content-type: application/json; charset=utf-8

Response:

    {
       "data": [
           {
               "bluetoothConnectionInfo": {
                   "bluetoothId": "[BT MAC]",
                   "bluetoothName": "[BT NAME]"
               },
               "displayInDashboard": true,
               "firmwareVersionCode": 12,
               "gasbuddyInfo": {
                   "criticalLevel": null,
                   "gasCapacity": null,
                   "gasLevelCalibration": null,
                   "gasStock": null,
                   "tankInstalledDate": null,
                   "tareWeight": null
               },
               "grillBackendId": [ID],
               "isWifiConnected": true,
               "nickname": "[NICKNAME]",
               "preferredConnectionProtocol": "wifi",
               "serialNumber": "[SERIAL NUMBER]",
               "popKey": "[POP KEY]",
               "tsLastChanged": "[TIMESTAMP]"
           }
       ]
    }
    
Example

`curl -X GET -H "Content-Type: application/json; charset=utf-8" -H "authorization: [TOKEN]" "https://mobile-api.ottowildeapp.com/v2/grills"`

### Firmware Information

URL: https://mobile-api.ottowildeapp.com/firmware

The firmware service returns information about the latest available firmware and requires the Auth-Token from the login service in the header of the GET request.

GET Request:

    authorization: [TOKEN]

Response:

    {
       "data": {
           "filename": "OWG-SCB-V2.0(220602)_2216_num12.signed.bin",
           "id": 12,
           "versionNumber": 12
       }
    }

TODO: Find out the full URL of the firmware.

### Sensor information service
```
Host: socket.ottowildeapp.com
Port: 4502
```
The actual sensor readings are available via a raw TCP socket server and come in a binary blurp. This service needs the pop-key and the serial number of the grill (as indicated on the sticker on the device) as authorization. Once you send `{"channel":"LISTEN_TO_GRILL","data":{"grillSerialNumber":" [SERIAL NUMBER IN LOWERCASE]","pop":"[POP-KEY]"}'` to the server, it starts responding with a binary blurp every second. Thanks to the great work of user [Sandorson](https://www.grillsportverein.de/forum/members/sandorson.162581/) in the [GSV Forum](https://www.grillsportverein.de/forum/threads/otto-wilde-g32-connected-erfahrungen.352049/post-5350750), the content of this blurp (which seems to be identical to what is send over BLE by the device) is mostly understood and can therefore be transformed into a human readable format.

An MVP for a Cloud Function written in Node.JS can be found in this repository. Please do not consider it complete by any means, it's more of a proof of concept.

## TODOs

- Figure out how to understand if a grill is switched on or off.
- Build an integration for Home Assistant that continously reads from the socket service to update the information in real time.
