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


# url for compnay admin
curl -X GET \
  'http://52.64.157.221:6789/api/v1/users/2859f21a-1acb-4309-8344-2f294c49789d' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InN5c2FkbWluQGRoaXZlLnZuIiwianRpIjoiM2JlMzQyNjUtN2QxOS00NDAyLWE1YjctNzllYzQ4ZmIyN2UzIiwiY29tcGFueUlkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwicm9sZXMiOlsiU1lTX0FETUlOIl0sImlhdCI6MTc3NTQ1NzgwNiwiZXhwIjoxNzc1NzE3MDA2fQ.UX3FYmmG-BiEfzEexyeTSlSNLgUbXMBJqCeXv2DvdN8'

