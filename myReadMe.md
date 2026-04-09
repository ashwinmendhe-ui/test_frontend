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

