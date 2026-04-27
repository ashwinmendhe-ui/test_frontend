## 1. Project created 
npm create vite@latest .
## 2. installed taiwindcss
npm i tailwindcss @tailwindcss/vite
## add tailwindcss plugin in vite.config.js 

## 3. install react-router-dom zustand
npm i react-router-dom zustand


## 4. for checking repo tree structure in mac command
tree -L 3

## 5. install ant design
npm install @ant-design/icons

## 6. For korea language support 
npm install i18next react-i18next

## 7. for pdf and view support
npm install jspdf html2canvas

## 8. for charts
npm install recharts

## 9. API integration
# this below link for getting user detail and works for system admin
# Requeest
curl -X GET \
  'http://52.64.157.221:6789/api/v1/users/11111111-1111-1111-1111-111111111111' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InN5c2FkbWluQGRoaXZlLnZuIiwianRpIjoiM2JlMzQyNjUtN2QxOS00NDAyLWE1YjctNzllYzQ4ZmIyN2UzIiwiY29tcGFueUlkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwicm9sZXMiOlsiU1lTX0FETUlOIl0sImlhdCI6MTc3NTQ1NzgwNiwiZXhwIjoxNzc1NzE3MDA2fQ.UX3FYmmG-BiEfzEexyeTSlSNLgUbXMBJqCeXv2DvdN8'

# response 
{"roles":[1],"user":{"deviceIds":[],"companyName":"D.Hive Corporation","fullName":"System Administrator","sites":[],"missionIds":[],"isActive":true,"userId":"11111111-1111-1111-1111-111111111111","createdAt":"2026-01-09 19:08:40","companyId":"00000000-0000-0000-0000-000000000000","roleIds":[1],"phone":"+84-90-1111-1111","id":12,"roleNames":["SYS_ADMIN"],"email":"sysadmin@dhive.vn","username":"sysadmin","updatedAt":"2026-04-06 15:43:26"}}


# url for compnay admin, here token is used of system administrator to access company details 
curl -X GET \
  'http://52.64.157.221:6789/api/v1/users/2859f21a-1acb-4309-8344-2f294c49789d' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyODU5ZjIxYS0xYWNiLTQzMDktODM0NC0yZjI5NGM0OTc4OWQiLCJlbWFpbCI6ImFzaHdpbi5tZW5kaGVAZGhpdmUucHJvIiwianRpIjoiMWRiYmUyMTItNWY3Yy00NzRmLWI5ODktY2FkNjI5ZGY5NjcwIiwiY29tcGFueUlkIjoiYjkzM2NhNjUtNzliNi00MjVmLWE0YzItNGMyNjkwMGU4YTZmIiwicm9sZXMiOlsiU1lTX0FETUlOIl0sImlhdCI6MTc3NTY0Mzk5NCwiZXhwIjoxNzc1OTAzMTk0fQ.BoYSQH_QgUltkAol4RJwvXVDhi8vCtUJOArOdstJDwE'


  ## for API integration install axios
  npm i axios

Some examples of API endpoints 
## company search GET API
http://52.64.157.221:6789/api/v1/companies/search

{
        "id": 0,
        "companyId": "00000000-0000-0000-0000-000000000000",
        "name": "D.Hive Corporation",
        "phoneNumber": "+84123456789000",
        "email": "contact@dhive.pro",
        "address": "대전광역시 유성구 유성대로877번길 7",
        "status": "active",
        "description": "SYSTEM COMPANY.\nhttps://diveintothehive.com/",
        "createdAt": "2026-01-09 19:08:40",
        "updatedAt": "2026-02-11 19:59:00"
    },

## company site search
http://52.64.157.221:6789/api/v1/sites?companyId=00000000-0000-0000-0000-000000000000
[
    {
        "id": 29,
        "siteId": "7f76096e-d9f7-4c60-b79d-dc2dc9897b05",
        "companyId": "00000000-0000-0000-0000-000000000000",
        "companyName": "D.Hive Corporation",
        "deviceCount": 0,
        "deviceOnlineCount": 0,
        "missionCount": 5,
        "name": "Doan2 Hillstate",
        "address": "대전광역시 학하동 79",
        "phoneNumber": "+84123456789123",
        "email": "jungkyun.jung@dhive.pro",
        "createdAt": "2026-03-17 13:00:40",
        "updatedAt": "2026-03-17 13:00:40"
    }
]

## file upload post API
http://52.64.157.221:6789/api/v1/missions

body
{
  "companyId": "00000000-0000-0000-0000-000000000000",
  "siteId": "7f76096e-d9f7-4c60-b79d-dc2dc9897b05",
  "missionName": "Test Mission",
  "missionType": "Patrol",
  "file": "test2.txt",
  "deviceType": "Drone",
  "description": "test"
}



## file download working
https://dhive.s3.ap-southeast-2.amazonaws.com/missions/89c0a6ba-dff9-47d8-8c73-42aa7fab54cf/Summary.txt?response-content-disposition=attachment%3B%20filename%3D%22Summary.txt%22&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFwaDmFwLXNvdXRoZWFzdC0yIkYwRAIgMXKOPWfq4t%2BrNzH7TGmALPybqg2QcpApuwRW5T1h6h4CID9TkrVw3FnLELomp3QLgeYby9Q2OzErA4yuR6xukMD%2BKssFCCUQABoMODUyOTIxNjU4NTc2IgyXWuJ9JZRX8iHEfGgqqAXfzCrP%2F%2FIqLSYJ3%2Bd9lFBbMLQ7mB804ZPebXbLBjxgySAPfZGArxO65LGR8TAa2zAeulnWo40XcPp1rN50EhOYuN4OtjLNJ4IEfKj5y8Re774p4FHlKBe51Gak2xzLPkXYu2JU8AVcE2fOBarSfVnYkduQ6BdwovuI61XRP6ydmq1nrs%2FDk%2FNWNjToxk8IgeYUVLqySzpQIBcwwm%2B7C%2F9KyAIaJPGGqDgdhsDaPJVVXsvA%2Bj3%2BLAkJ4K0vUf43UMO4%2Bwh6MfjekLOun3ovDiswhEQxxfMMXyfYidXauem8Kgc4kvw%2Bl40FJv95UqCZzXUi%2FsdUpWYZ03y3cFovc9YFMeZT7gLZwgNbsoTNZr2R8WiLFF7Db6mFlnXZXqfGRoUFQKIxoYLFiJNYwqh9ZfmIm%2BwqRYPtzVW2k0ieJTUHSYT3IRqx%2Fm6wq%2FF7qVuX6tE7CclFyLwaRraqIIw6Fn1z5fQgscvAer1najclGfex93AQPxMlVRn7suvgktKbfOrtcjbinHcdzS7uAM%2B6lrmjQxAb8XP7VylQTu7fyqRd%2BWtSROdCexgq4g8rWgMKMKQcJysfG%2BawWlEjWk8l5H9qFBcBpHN5VuB1ZbNeDkVSMcnE3U9lyx7dAalgg5I7SMNfU2OfCz5JS3zXqeSx%2BGxrVVvtsVurXs7sWzBxG4citqZF4zOvVEnrGZs1I0bHumLziOgNs1R%2B5VwjGh%2FKUZruoMMSYjCVYn2JUhk%2FiTmMLXzCRJtKryUZ7N4qoV3H%2BW5RjetyVN2f%2BZlkBb1QEGyOrrOH%2FoCH3mxiuXYSuqlxDlQbZAlM0SbIhTIPC4rMhTz%2Ba6lYJLgwu3MFY0pJECWmgQd63w7ZHhemtdHDcKgfD5iXR9s2OeJkaKKqtFEIOkXh%2BG4R7RP3dzD36eHOBjqyAQ%2B%2Ffw1WEpGPbcefcHU2PL35y1a8YVm77aZ2HAFrf9OpMAiGKlngDXMh8mzJzT3Zklj1CLe%2FiDPOwsN1otiwmc6E5yJ5YqWS0%2B8HmgkpMocrnnTHCrDNHdL7hMnKUpmYdxZBqhrxH2nesY6mPeDjQOrIQBiDytmj0R8PwhpcHTN%2FjfmiBsubkiPGI2SQA7QBNL8Q%2By1t2izj7Ee%2By4xhqI9E109BKam2a9fgoPowLAleEXA%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260410T043216Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3599&X-Amz-Credential=ASIA4NFQXVTIDLKWXWBC%2F20260410%2Fap-southeast-2%2Fs3%2Faws4_request&X-Amz-Signature=e4d4ed839a40cdbdea2470e6f4cf49a8e3cee91a5b743c8cb1962c38f7521850


## file download not working
https://dhive.s3.ap-southeast-2.amazonaws.com/missions/6115cd63-b9df-4410-9a17-892bec201bb5/dashboard.svg?response-content-disposition=attachment%3B%20filename%3D%22dashboard.svg%22&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFwaDmFwLXNvdXRoZWFzdC0yIkYwRAIgMXKOPWfq4t%2BrNzH7TGmALPybqg2QcpApuwRW5T1h6h4CID9TkrVw3FnLELomp3QLgeYby9Q2OzErA4yuR6xukMD%2BKssFCCUQABoMODUyOTIxNjU4NTc2IgyXWuJ9JZRX8iHEfGgqqAXfzCrP%2F%2FIqLSYJ3%2Bd9lFBbMLQ7mB804ZPebXbLBjxgySAPfZGArxO65LGR8TAa2zAeulnWo40XcPp1rN50EhOYuN4OtjLNJ4IEfKj5y8Re774p4FHlKBe51Gak2xzLPkXYu2JU8AVcE2fOBarSfVnYkduQ6BdwovuI61XRP6ydmq1nrs%2FDk%2FNWNjToxk8IgeYUVLqySzpQIBcwwm%2B7C%2F9KyAIaJPGGqDgdhsDaPJVVXsvA%2Bj3%2BLAkJ4K0vUf43UMO4%2Bwh6MfjekLOun3ovDiswhEQxxfMMXyfYidXauem8Kgc4kvw%2Bl40FJv95UqCZzXUi%2FsdUpWYZ03y3cFovc9YFMeZT7gLZwgNbsoTNZr2R8WiLFF7Db6mFlnXZXqfGRoUFQKIxoYLFiJNYwqh9ZfmIm%2BwqRYPtzVW2k0ieJTUHSYT3IRqx%2Fm6wq%2FF7qVuX6tE7CclFyLwaRraqIIw6Fn1z5fQgscvAer1najclGfex93AQPxMlVRn7suvgktKbfOrtcjbinHcdzS7uAM%2B6lrmjQxAb8XP7VylQTu7fyqRd%2BWtSROdCexgq4g8rWgMKMKQcJysfG%2BawWlEjWk8l5H9qFBcBpHN5VuB1ZbNeDkVSMcnE3U9lyx7dAalgg5I7SMNfU2OfCz5JS3zXqeSx%2BGxrVVvtsVurXs7sWzBxG4citqZF4zOvVEnrGZs1I0bHumLziOgNs1R%2B5VwjGh%2FKUZruoMMSYjCVYn2JUhk%2FiTmMLXzCRJtKryUZ7N4qoV3H%2BW5RjetyVN2f%2BZlkBb1QEGyOrrOH%2FoCH3mxiuXYSuqlxDlQbZAlM0SbIhTIPC4rMhTz%2Ba6lYJLgwu3MFY0pJECWmgQd63w7ZHhemtdHDcKgfD5iXR9s2OeJkaKKqtFEIOkXh%2BG4R7RP3dzD36eHOBjqyAQ%2B%2Ffw1WEpGPbcefcHU2PL35y1a8YVm77aZ2HAFrf9OpMAiGKlngDXMh8mzJzT3Zklj1CLe%2FiDPOwsN1otiwmc6E5yJ5YqWS0%2B8HmgkpMocrnnTHCrDNHdL7hMnKUpmYdxZBqhrxH2nesY6mPeDjQOrIQBiDytmj0R8PwhpcHTN%2FjfmiBsubkiPGI2SQA7QBNL8Q%2By1t2izj7Ee%2By4xhqI9E109BKam2a9fgoPowLAleEXA%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20260410T043448Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=ASIA4NFQXVTIDLKWXWBC%2F20260410%2Fap-southeast-2%2Fs3%2Faws4_request&X-Amz-Signature=f75850a25f3d4c0a635486a527c1547a5df8cd2192b6ef90377910427ebceacc"
    


      // console.log("updateUser payload:", JSON.stringify(param, null, 2));


## url link for stream API, this is on 7879 port
http://52.64.157.221:7879/api/stream/${id}

## All API link , on port 6789
http://52.64.157.221:6789/api

## install hls player
npm i hls.js


## install sockjs for websocket connetions
npm install @stomp/stompjs sockjs-client
npm install -D @types/sockjs-client