# API Integration Notes -- Corrected Working Paths

## Overview

This document captures the **actual working backend API paths** used
during RoboPilot frontend integration.

**Base URL**

    http://52.64.157.221:6789/api

**Auth**

    Authorization: Bearer <token>

------------------------------------------------------------------------

## 1. Authentication

### Login

    POST /v1/auth/login

Request:

``` json
{
  "email": "user@example.com",
  "password": "password"
}
```

------------------------------------------------------------------------

## 2. Users

    GET /v1/users/search
    GET /v1/users/{id}
    GET /v1/users/{id}/roles
    GET /v1/roles
    POST /v1/users
    POST /v1/users/update/{id}
    POST /v1/users/delete/{id}

------------------------------------------------------------------------

## 3. Companies

    GET /v1/companies/search
    GET /v1/companies/{id}
    POST /v1/companies
    POST /v1/companies/update/{id}
    POST /v1/companies/delete/{id}

------------------------------------------------------------------------

## 4. Sites

    GET /v1/sites/search
    GET /v1/sites?companyId={companyId}
    GET /v1/sites/{id}
    POST /v1/sites
    POST /v1/sites/update/{id}
    POST /v1/sites/delete/{id}

------------------------------------------------------------------------

## 5. Missions

    GET /v1/missions/search
    GET /v1/missions?companyId={companyId}
    GET /v1/missions?siteId={siteId}
    GET /v1/missions/{id}
    POST /v1/missions
    POST /v1/missions/update/{id}
    POST /v1/missions/delete/{id}

### Notes

-   Requires real UUIDs
-   Uses S3 presigned upload flow
-   Known issues:
    -   S3 CORS (browser)
    -   upload/download key mismatch

------------------------------------------------------------------------

## 6. Robots (Devices)

    GET /v1/devices/search   OR   GET /v1/devices
    GET /v1/devices/{id}
    POST /v1/devices
    POST /v1/devices/update/{id}   OR   PUT /v1/devices/{id}
    POST /v1/devices/delete/{id}   OR   DELETE /v1/devices/{id}

### Notes

-   Robot module maps to **devices**
-   `/v1/robots` does NOT exist

------------------------------------------------------------------------

## 7. Dashboard

    GET /v1/dashboard
    GET /v1/dashboard/stat

------------------------------------------------------------------------

## 8. Stream

    GET /v1/stream
    POST /v1/stream/start
    POST /v1/stream/stop
    GET /v1/stream/{id}/metadata

------------------------------------------------------------------------

## 9. History

    GET /v1/history
    GET /v1/history/{id}

------------------------------------------------------------------------

## 10. Report

    POST /v1/report

------------------------------------------------------------------------

## Conventions

-   JWT stored in localStorage
-   Axios adds Authorization header
-   401 → redirect to login
-   Search endpoints use:
    -   keyword
    -   from
    -   to

------------------------------------------------------------------------

## Status

  Module         Status
  -------------- -------------
  Auth           Done
  User           Done
  Company        Done
  Site           Done
  Mission        Done
  Robot/Device   In Progress

------------------------------------------------------------------------

## Notes

-   Always use real UUIDs
-   Prefer working API over SRS
-   Validate endpoints via Postman if 404 occurs
