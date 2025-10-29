# SerializedDataService

## 1. Overview

The `SerializedDataService` is responsible for reading and serving data objects that are deserialized from `.mjson` (Mod JSON serialization) files.

## 2. Core Requirements

### 2.1. Data Format

All data served by this service **MUST** be stored in the `.mjson` serialization format.

### 2.2. Object Identification & Idempotency

To ensure that repeated deserialization operations are idempotent, every serialized object instance **MUST** have a persistent `UUID v7` assigned as its identifier.

This UUID must be generated and stored manually in the `.mjson` file.

**Implementation**: Use the mod CLI command to generate this identifier:

```bash
mod uuid generate
```

This will output a UUID v7, e.g., _`019a245c-1467-73c0-9c0e-c6e76846030f`_

## 3. Storage & Referencing Strategy

We support two storage patterns for object instances in .mjson files. The right choice depends on access patterns and operational constraints: a single “all-in-one” file simplifies browsing and management but can cause large file loads, while an indexed per-instance layout makes single-object access and explicit file-based references efficient at the cost of many files and a two-step lookup. Choose the former for small or frequently browsed datasets; choose the latter for large datasets, frequent single-object reads.

### 3.1. Option 1: Single File per Type (All-in-One)

All instances of a single data type are stored in one .mjson file.

**Example:**

`data/instance/countries.mjson` contains all `Country` objects.

```json
{
    "root": {
        "value": [{ "@": "US" }, { "@": "FR" }]
    },
    "US": {
        "prototype": "mod/data/model/country",
        "values": {
            "isCode366": "US",
            "name": "United States",
            "capital": "Washington, D.C.",
            "population": 331900000
        }
    },
    "FR": {
        "prototype": "mod/data/model/country",
        "values": {
            "isCode366": "FR",
            "name": "France",
            "capital": "Paris",
            "population": 68606000
        }
    }
}
```

**Pros:**

-   Fewer files to manage.
-   Easy to browse all instances of a type.

**Cons:**

-   Potentially large file loads, even if only one object is needed.

### 3.2. Option 2: Indexed Individual Files

:warning: Not implemented yet!

An index file (e.g., `roles.mod`) lists all instances, but each instance is stored in its own separate .mjson file.
This file acts as a directory or a map. Its purpose is to tell the `SerializedDataService` where to find the data for a specific instance

**Examples:**

Index file `data/instance/party/roles.mod` point to:

-   `data/instance/party/roles/admin.mjson`
-   `data/instance/party/roles/user.mjson`

**1. The Index File:**

```json
// File: data/instance/party/roles.mod
{
    "root": {
        "admin": "data/instance/party/roles/admin.mjson",
        "user": "data/instance/party/roles/user.mjson",
        "guest": "data/instance/party/roles/guest.mjson"
    }
}
```

**2. Admin Role:**

```json
// File: data/instance/party/roles/admin.mjson
{
    "root": {
        "value": { "@": "AdminRole" }
    },
    "AdminRole": {
        "prototype": "data/party/role.mjson",
        "values": {
            "uuid": "019a245c-1467-73c0-9c0e-c6e76846030f",
            "name": "Administrator",
            "permissions": ["create_users", "delete_content", "manage_settings"]
        }
    }
}
```

**3. User Role:**

```json
// File: data/instance/party/roles/user.mjson
{
    "root": {
        "value": { "@": "UserRole" }
    },
    "UserRole": {
        "prototype": "data/party/role.mjson",
        "values": {
            "uuid": "019a245d-5b8a-79a0-8a12-b7c86a5d041e",
            "name": "Standard User",
            "permissions": ["create_content", "edit_own_content"]
        }
    }
}
```

**Pros:**

-   Efficiently load a single object (e.g., fetching one TimeZone for a user).
-   Clear, explicit file-based referencing.

**Cons:**

-   High file-count, which can be difficult to manage.
-   Requires a two-step lookup (index, then file).

## 4. Single File per Type request flow

### Scenario

A client requests a complete list of `Country` objects (for example, to populate a dropdown). To fulfill this, it triggers a `readOperation` targeting the `Country` type.

#### Steps

##### 1. Request received

A client executes a read operation:

```js
import { montageObject as Country } from "mod/data/model/country.mjson";

async function _loadCountries() {
    const mainService = this.application.mainService;
    this.countries = await mainService.fetchData(Country);
}
```

This ultimately triggers `SerializedDataService.handleReadOperation(readOperation)` method.
The `readOperation.target` will be the `Country` object/type.

##### 2. Service Validates Request

```js
if (!this.handlesType(readOperation.target)) {
    return;
}
```

:question: Questions:

1. Does the service check whether it supports a given type? If so, how and where are supported types registered?

##### 3. File Location

Our service needs to know which file to open for the Country type.

:question: Questions:

1. How do we find the file related to a type? Should we use a map?

##### 4. File Deserialization

The service now reads `data/instance/countries.mjson` from the disk using `fs.readFile`;

It parses the `.mjson` content containing all Country instances ("US", "FR", etc.) and a "root" key pointing to them.

The service would deserialize these objects into "real" DataObjects using Mod deserializer.

##### 5. Data Filtering

:warning: Not implemented yet!

One of our service's job is also to filter the full list of deserialized objects. The readOperation might have criteria (e.g., where `name == "France"`).

If the criteria was for `"France"`, it would find the `"FR"` object. If there were no criteria, it would return the full list of countries.

```js
let dataObjectsMatchingCriteria = allDataObjects.filter(readOperation.criteria.predicateFunction);
```

##### 6. Data Returned

This is the final step `responseOperation.target.dispatchEvent(responseOperation)`:
Our data service bundles the filtered results into a responseOperation. Then, It dispatches this response, which sends the data back to the client that originally asked for it.

## 5. Service Implementation & Behavior

### 5.1. Internal Data Handling

When a `readOperation` is received, the service must be able to filter data based on the operation's criteria.

:warning: TODO

### 5.2. Output Strategy (Context-Dependent)

The service must return data differently depending on the client's execution context.

:warning: TODO
