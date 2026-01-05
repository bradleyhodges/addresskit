<img src="https://exbluygwdjrpygxgzsdc.supabase.co/storage/v1/object/public/addresskit/AddressKit-Logo.png" height="64" alt="AddressKit" />

<br />

[![GitHub license](https://img.shields.io/github/license/bradleyhodges/addresskit)](https://github.com/bradleyhodges/addresskit/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/@bradleyhodges/addresskit)](https://www.npmjs.com/package/@bradleyhodges/addresskit) [![npm downloads](https://img.shields.io/npm/dm/@bradleyhodges/addresskit)](https://www.npmjs.com/package/@bradleyhodges/addresskit) [![Docker Image Version (latest by date)](https://img.shields.io/docker/v/bradleyhodges/addresskit?label=image%20version)](https://hub.docker.com/r/bradleyhodges/addresskit) [![Docker Pulls](https://img.shields.io/docker/pulls/bradleyhodges/addresskit)](https://hub.docker.com/r/bradleyhodges/addresskit)

[![GitHub issues](https://img.shields.io/github/issues/bradleyhodges/addresskit)](https://github.com/bradleyhodges/addresskit/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr/bradleyhodges/addresskit)](https://github.com/bradleyhodges/addresskit/pulls) [![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/@bradleyhodges/addresskit)](https://libraries.io/npm/@bradleyhodges%2Faddresskit)


# About

AddressKit is an open-source, scalable address ingestion, validation, search, and autocomplete engine that handles complex address structures for address validation of Australian addresses against the [Geocoded National Address File](https://data.gov.au/data/dataset/geocoded-national-address-file-g-naf) (referred to as G-NAF) &mdash; Australia's authoritative address file.

This project is a fork of [Addressr](https://github.com/mountain-pass/addressr), with the objective of improving the quality, performance, and maintainability of the codebase. AddressKit is a rewrite of Addressr in TypeScript with numerous improvements, and is a major improvement over the original project, which is sparsely maintained and contains dangerously outdated dependencies. 

It is available as a self-hosted solution, or can be accessed for free through the AddressKit REST API. 

AddressKit is actively maintained and developed by [Bradley Hodges](https://github.com/bradleyhodges) and is not affiliated with Addressr or its author, Mountain Pass. 

## Licensing

*Addressr* (the library which AddressKit was forked from) is licensed under the [Apache 2.0](https://github.com/mountain-pass/addressr/blob/f0eb2faa6098e69e5a912e4b6af70c73e5b380a3/LICENSE.md), which expressly permits commercial use, modification, distribution, and sublicensing. You can read more about Apache 2.0 license terms [here](https://www.tldrlegal.com/license/apache-license-2-0-apache-2-0). 

**AddressKit is licensed under the [GNU GPLv2](https://github.com/bradleyhodges/addresskit/blob/master/LICENSE)** license. You can read more about the GNU GPLv2 license [here](https://www.tldrlegal.com/license/gnu-general-public-license-v2).

## Features
AddressKit is a comprehensive solution for managing and validating Australian addresses. Notable features include:

- ✅ **Autocomplete:** Blazingly fast search and autocomplete of Australian addresses based on partial input with result paging, sorting, and filtering
- ✅ **Canonical validation**: Validation is built into AddressKit's core data model since every address is resolved from the [G-NAF](https://data.gov.au/data/dataset/geocoded-national-address-file-g-naf) by default, so "valid" automatically means "authoritatively correct"
- ✅ **Always up-to-date:** AddressKit automatically refreshes its data from the [G-NAF](https://data.gov.au/data/dataset/geocoded-national-address-file-g-naf) every 3 months
- ✅ **Real-time address validation:** Address validation and autocomplete for Australian addresses
- ✅ **JSON:API compliant:** RESTful API conforming to the [JSON:API v1.1 specification](https://jsonapi.org/format/) for standardized, predictable responses
- ✅ **Easy to use API:** Straightforward REST API and CLI service for building your own address validation and autocomplete solutions
- ✅ **Beautiful CLI:** Modern command-line interface with colorful output, progress indicators, and intuitive commands
- ✅ **Run on your own infrastructure or use ours:** Self-host or use our hosted solution
- ✅ **Completely free and open-source:** Completely free or pay for support
- ✅ **Geocoding:** Geocoding of addresses to latitude and longitude coordinates
- ✅ **Cross-platform:** Works on Windows, macOS, and Linux

---
# Table of Contents

- [Installation](#installation)
  - [Docker Compose](#docker-compose)
  - [Using npm](#using-npm)
- [Enabling Geocoding](#enabling-geocoding)
- [Updating AddressKit](#updating-addresskit)
- [CLI Reference](#cli-reference)
  - [Commands](#commands)
  - [`load` Command](#load-command)
  - [`start` Command](#start-command)
  - [`version` Command](#version-command)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Search / Autocomplete](#search--autocomplete)
  - [Get Address Details](#get-address-details)
  - [Error Responses](#error-responses)
- [System Requirements](#system-requirements)
  - [Supported Platforms](#supported-platforms)

---
# Installation

If you prefer to self-host AddressKit, you have two options for installation: using **[Docker Compose](#docker-compose) (recommended)**, or globally using [npm](#using-npm). 

## Docker Compose

The fastest way to get AddressKit running. No installation required - just good ol' Docker.

#### 1. Create `docker-compose.yml` in your project root, and copy this into it:

```yaml
services:
  opensearch:
    image: opensearchproject/opensearch:1.3.2
    environment:
      - discovery.type=single-node
      - plugins.security.disabled=true
      - OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9200:9200" # This is the port that OpenSearch will listen on for requests from AddressKit
    volumes:
      - opensearch-data:/usr/share/opensearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:9200/ >/dev/null || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 40
    restart: unless-stopped

  api:
    image: bradleyhodges/addresskit:latest
    environment:
      - ELASTIC_HOST=opensearch
      - ELASTIC_PORT=9200 # This tells AddressKit to connect to OpenSearch on port 9200 (see above)
      - PORT=8080 # This is the port that the AddressKit REST API will listen on
    ports:
      - "8080:8080" # This is the port that AddressKit will listen on for requests from your application
    depends_on:
      opensearch:
        condition: service_healthy
    command: ["addresskit", "start", "--daemon"]
    restart: unless-stopped

  loader:
    image: bradleyhodges/addresskit:latest
    environment:
      - ELASTIC_HOST=opensearch
      - ELASTIC_PORT=9200
      # Uncomment to load specific states only (faster)
      # - COVERED_STATES=NSW,VIC
      # Uncomment to enable geocoding (requires more memory)
      # - ADDRESSKIT_ENABLE_GEO=1
    volumes:
      - gnaf-data:/home/node/gnaf
    depends_on:
      opensearch:
        condition: service_healthy
    command: ["addresskit", "load"]
    restart: "no"

volumes:
  opensearch-data:
  gnaf-data:
```

#### 2. Start OpenSearch and the AddressKit REST API server by running:

```bash
docker compose up -d opensearch api
```

#### 3. Load the G-NAF address data into the search index by running (this will take a while, depending on your internet connection and system performance):

```bash
# Load all Australian addresses (generally takes ~20-40 minutes)
docker compose run --rm loader
```

> [!TIP] 
> To load only specific states (faster), edit the `COVERED_STATES` environment variable in the compose file before running.

#### 4. Once the G-NAF address data has been loaded, you can test the API by searching for addresses (autocomplete) by running:

```bash
# Search for addresses (autocomplete)
curl -H "Accept: application/vnd.api+json" \
  "http://localhost:8080/addresses?q=LEVEL+25,+TOWER+3"

# Get detailed information for a specific address
curl -H "Accept: application/vnd.api+json" \
  "http://localhost:8080/addresses/GAVIC411711441"
```

The API returns JSON:API compliant responses. See [API Endpoints](#api-endpoints) for detailed examples.

### Docker Compose Services

| Service | Description | Default Port |
|---------|-------------|------|
| `opensearch` | Search backend | 9200 |
| `api` | REST API server | 8080 |
| `loader` | G-NAF data loader (run once) | - |

## Using npm

#### 1. Ensure you have Node.js >= 24.0.0 installed. You can check your Node.js version by running:

```bash
node --version
```

#### 2. Install the latest version of the AddressKit package globally using npm:

```bash
npm install -g @bradleyhodges/addresskit
```

After installation, the `addresskit` command will be available globally in your terminal. Verify the installation by running:

```bash
addresskit --version
```

#### 3. AddressKit requires OpenSearch (the search and indexing backend used by AddressKit) to be running - this is provided by the AddressKit Docker image. If you don't already have an OpenSearch instance running, you can start one by running:

```bash
docker pull opensearchproject/opensearch:1.3.20
docker run -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "plugins.security.disabled=true" \
  opensearchproject/opensearch:1.3.20
```

#### 4. Configure AddressKit by creating a `.env` file in the root of your project and adding the following variables ([see below](#environment-variables) for all supported environment variables):

```env
ELASTIC_HOST=opensearch
ELASTIC_PORT=9200
ELASTIC_PROTOCOL=http
ADDRESSKIT_ENABLE_GEO=0 # disable geocoding support (requires more memory) by default
```

#### 5. Start the AddressKit API server by running:

```bash
addresskit start
```

#### 6. Load the G-NAF address data into the search index by running:

```bash
addresskit load
```

> [!NOTE]
> If you are using AddressKit for the first time, you will need to load the G-NAF address data into the search index. This will take a while, depending on the size of the G-NAF dataset. Read more about the load command [here](#load-command).

---
# Enabling Geocoding

Geocoding is an optional feature that can be enabled by setting the `ADDRESSKIT_ENABLE_GEO` environment variable to `1`. This will enable geocoding of addresses to latitude and longitude coordinates. Note that geocoding requires more memory, and is disabled by default. To enable geocoding, add the following to your `.env` or `docker-compose.yml` file:

```env
ADDRESSKIT_ENABLE_GEO=1
NODE_OPTIONS=--max_old_space_size=8196 # This is the maximum memory allocation for the Node.js process. Adjust this value based on your system's available memory.
```

> [!IMPORTANT] Geocoding requires more memory
> With geocoding enabled, indexing takes longer and requires more memory (8GB recommended). If you are experiencing memory issues, you can adjust the `NODE_OPTIONS` value to allocate more memory to the Node.js process. You can read more about the `NODE_OPTIONS` environment variable [here](https://nodejs.org/api/cli.html#node_optionsoptions).

---
# Updating AddressKit

AddressKit is updated regularly to fix bugs and add new features. You can update AddressKit by pulling the latest Docker image:

```bash
docker pull bradleyhodges/addresskit:latest
```

Or, if you are using npm, by running:

```bash
npm install -g @bradleyhodges/addresskit
```

In addition to keeping AddressKit updated, you should regularly update the G-NAF address data to ensure you have the latest addresses. Updates to the G-NAF data are released every 3 months. To automate this chore, you could set up a cron job to keep AddressKit updated. For example, in Linux/macOS, you could add the following to your `crontab`:

```bash
# Run on the 1st of every month at 3am
0 3 1 * * addresskit load --clear # Note: passing the --clear flag will clear the index before loading the latest data, which may cause some downtime. Use with caution.
```

---
# CLI Reference

AddressKit provides a beautiful, intuitive command-line interface for managing your address validation service.

```
    ___       __    __                    __ __ _ __
   /   | ____/ /___/ /_______  __________/ //_/(_) /_
  / /| |/ __  / __  / ___/ _ \/ ___/ ___/ ,<  / / __/
 / ___ / /_/ / /_/ / /  /  __(__  |__  ) /| |/ / /_
/_/  |_\__,_/\__,_/_/   \___/____/____/_/ |_/_/\__/

  ─────────────────────────────────────────────────────
  Australian Address Validation & Autocomplete Engine
  ─────────────────────────────────────────────────────

Usage: addresskit [options] [command]

Options:
  -v, --version    Display version information
  -h, --help       Display help information

Commands:
  load [options]   Load G-NAF address data into the search index
  start [options]  Start the REST API server
  version          Display detailed version and environment information
  help [command]   Display help for a specific command
```

## Commands

| Command | Description |
|---------|-------------|
| `addresskit load` | Download and index G-NAF address data into OpenSearch |
| `addresskit start` | Start the REST API server |
| `addresskit version` | Display version and environment information |
| `addresskit help` | Display help information |

## `load` Command

Downloads the latest G-NAF dataset from data.gov.au, extracts it, and indexes all addresses into your OpenSearch instance.

```bash
addresskit load [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-d, --daemon` | Run in background mode (suppresses terminal output) | `false` |
| `-s, --states <states>` | Comma-separated list of states to load (e.g., `NSW,VIC,QLD`) | All states |
| `--clear` | Clear existing index before loading | `false` |
| `--geo` | Enable geocoding support | `false` |
| `-h, --help` | Display help for the load command | |

**Examples:**

```bash
# Load all states
addresskit load

# Load only NSW and VIC
addresskit load --states NSW,VIC

# Load with geocoding enabled
addresskit load --geo

# Clear index and reload specific states with geocoding
addresskit load --clear --states QLD,SA --geo

# Run in daemon mode (background, no output)
addresskit load -d
```

**Valid State Codes:**

| Code | State |
|------|-------|
| `ACT` | Australian Capital Territory |
| `NSW` | New South Wales |
| `NT` | Northern Territory |
| `OT` | Other Territories |
| `QLD` | Queensland |
| `SA` | South Australia |
| `TAS` | Tasmania |
| `VIC` | Victoria |
| `WA` | Western Australia |

## `start` Command

Starts the REST API server for address search and validation.

```bash
addresskit start [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-d, --daemon` | Run in background mode (suppresses terminal output) | `false` |
| `-p, --port <port>` | Port to listen on | `8080` or `$PORT` |
| `-h, --help` | Display help for the start command | |

**Examples:**

```bash
# Start server on default port (8080)
addresskit start

# Start server on custom port
addresskit start --port 3000

# Start in daemon mode
addresskit start -d

# Start on custom port in daemon mode
addresskit start -d -p 9000
```

## `version` Command

Displays detailed version and environment information.

```bash
addresskit version
```

---
# Environment Variables

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `ELASTIC_HOST` | OpenSearch host | `localhost` |
| `ELASTIC_PORT` | OpenSearch port | `9200` |
| `ELASTIC_PROTOCOL` | Protocol (`http` or `https`) | `http` |
| `ELASTIC_USERNAME` | OpenSearch username (optional) | |
| `ELASTIC_PASSWORD` | OpenSearch password (optional) | |
| `PORT` | API server port | `8080` |
| `ES_INDEX_NAME` | OpenSearch index name | `addresskit` |
| `COVERED_STATES` | Comma-separated list of states to load | All states |
| `ADDRESSKIT_ENABLE_GEO` | Enable geocoding (`1` to enable) | Disabled |
| `PAGE_SIZE` | Default results per page | `8` |
| `ADDRESSKIT_ACCESS_CONTROL_ALLOW_ORIGIN` | CORS allowed origin | |
| `ADDRESSKIT_ACCESS_CONTROL_EXPOSE_HEADERS` | CORS exposed headers | |
| `ADDRESSKIT_ACCESS_CONTROL_ALLOW_HEADERS` | CORS allowed headers | |
| `ADDRESSKIT_INDEX_TIMEOUT` | Index operation timeout | `30s` |
| `ADDRESSKIT_INDEX_BACKOFF` | Initial backoff delay (ms) | `1000` |
| `ADDRESSKIT_INDEX_BACKOFF_INCREMENT` | Backoff increment (ms) | `1000` |
| `ADDRESSKIT_INDEX_BACKOFF_MAX` | Maximum backoff delay (ms) | `10000` |

> **Note:** When adjusting `PAGE_SIZE`, consider how quickly you want initial results returned. For most use cases, leave it at 8 and use pagination for additional results. Why 8? [Mechanical Sympathy](https://dzone.com/articles/mechanical-sympathy).

---
# API Endpoints

The AddressKit API conforms to the [JSON:API v1.1 specification](https://jsonapi.org/format/). All responses use the `application/vnd.api+json` media type.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/addresses?q=<query>` | GET | Search for addresses (autocomplete) |
| `/addresses?q=<query>&page[number]=<n>` | GET | Search with pagination |
| `/addresses/:id` | GET | Get detailed information for a specific address |
| `/docs` | GET | OpenAPI/Swagger documentation |

## Search / Autocomplete

Search for addresses matching a query string. Returns lightweight autocomplete suggestions optimized for typeahead UX.

**Request:**

```bash
curl -H "Accept: application/vnd.api+json" \
  "http://localhost:8080/addresses?q=300+barangaroo"
```

**Response:**

```json
{
  "jsonapi": {
    "version": "1.1"
  },
  "data": [
    {
      "type": "address-suggestion",
      "id": "GANSW716635811",
      "attributes": {
        "sla": "LEVEL 25, TOWER 3, 300 BARANGAROO AV, BARANGAROO NSW 2000",
        "rank": 1
      },
      "links": {
        "self": "/addresses/GANSW716635811"
      }
    },
    {
      "type": "address-suggestion",
      "id": "GANSW716635812",
      "attributes": {
        "sla": "LEVEL 26, TOWER 3, 300 BARANGAROO AV, BARANGAROO NSW 2000",
        "rank": 0.92
      },
      "links": {
        "self": "/addresses/GANSW716635812"
      }
    }
  ],
  "links": {
    "self": "/addresses?q=300+barangaroo",
    "first": "/addresses?q=300+barangaroo",
    "prev": null,
    "next": "/addresses?q=300+barangaroo&page[number]=2",
    "last": "/addresses?q=300+barangaroo&page[number]=5"
  },
  "meta": {
    "total": 42,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

## Get Address Details

Retrieve comprehensive details for a specific address by its G-NAF Persistent Identifier (PID). Use this endpoint after a user selects an address from the autocomplete results.

**Request:**

```bash
curl -H "Accept: application/vnd.api+json" \
  "http://localhost:8080/addresses/GANSW716635811"
```

**Response:**

```json
{
  "jsonapi": {
    "version": "1.1"
  },
  "data": {
    "type": "address",
    "id": "GANSW716635811",
    "attributes": {
      "pid": "GANSW716635811",
      "sla": "LEVEL 25, TOWER 3, 300 BARANGAROO AV, BARANGAROO NSW 2000",
      "ssla": "25/300 BARANGAROO AV, BARANGAROO NSW 2000",
      "mla": [
        "LEVEL 25",
        "TOWER 3",
        "300 BARANGAROO AV",
        "BARANGAROO NSW 2000"
      ],
      "structured": {
        "buildingName": "Tower 3",
        "level": {
          "type": { "name": "Level", "code": "L" },
          "number": 25
        },
        "number": {
          "number": 300
        },
        "street": {
          "name": "Barangaroo",
          "type": { "name": "Avenue", "code": "AV" }
        },
        "locality": {
          "name": "Barangaroo",
          "class": { "code": "G", "name": "GAZETTED LOCALITY" }
        },
        "state": {
          "name": "New South Wales",
          "abbreviation": "NSW"
        },
        "postcode": "2000",
        "confidence": 2
      },
      "geo": {
        "level": {
          "code": 7,
          "name": "LOCALITY, STREET, ADDRESS"
        },
        "geocodes": [
          {
            "latitude": -33.8535,
            "longitude": 151.2012,
            "isDefault": true,
            "reliability": {
              "code": 2,
              "name": "WITHIN ADDRESS SITE BOUNDARY OR ACCESS POINT"
            },
            "type": {
              "code": 2,
              "name": "PROPERTY CENTROID"
            }
          }
        ]
      }
    },
    "links": {
      "self": "/addresses/GANSW716635811"
    }
  },
  "links": {
    "self": "/addresses/GANSW716635811"
  }
}
```

## Error Responses

All error responses follow the JSON:API error format:

```json
{
  "jsonapi": {
    "version": "1.1"
  },
  "errors": [
    {
      "status": "404",
      "code": "RESOURCE_NOT_FOUND",
      "title": "Not Found",
      "detail": "The address with ID 'INVALID_123' does not exist."
    }
  ]
}
```

| Status | Description |
|--------|-------------|
| `400` | Bad Request - Invalid query parameters |
| `404` | Not Found - Address ID does not exist |
| `500` | Internal Server Error - Unexpected error |
| `503` | Service Unavailable - OpenSearch unavailable |
| `504` | Gateway Timeout - Query timeout |

---
# System Requirements

AddressKit is designed to be lightweight and efficient. It is built to run on modest hardware, and is designed to be self-hosted on your own infrastructure. System requirements are as follows:

- **Memory:** 2GB (4GB+ recommended)
- **Processor:** 1 core (2+ cores recommended)
- **Disk:** 10 GB

These requirements do not include the memory required by the base operating system or other processes running on the same machine. These requirements represent the minimum requirements for AddressKit to run, and may vary depending on your use case.

> [!NOTE]
> If you choose to enable geocoding, you will need to increase the memory requirements to 4GB or more. We recommend at least 8GB of available memory for geocoding.

## Supported Platforms

- **Windows** 10/11 (x64)
- **macOS** 12+ (Intel and Apple Silicon)
- **Linux** (x64, arm64)
  - Ubuntu 20.04+
  - Debian 11+
  - CentOS 8+
  - Amazon Linux 2+
