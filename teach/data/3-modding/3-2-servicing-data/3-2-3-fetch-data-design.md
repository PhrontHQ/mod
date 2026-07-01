# Fetching Data Life Cycle Design

## Two Types of fetch

### 1. User-triggered Fetch

There are 2 methods to do so:

1. mainService.fetchData(aDataQuery)
2. mainService.getObjectProperties() and getObjectsProperties() /* plural */ - Those should be renamed getInstancePropertyExpressions() and getInstancesPropertyExpressions()

### 2. Framework-triggered Fetch

There are 2 use-cases that fetch dat to fullfill instances' proeprty values

1. During mapping Raw Data to instance's property values
2. When an instance property is accesssed and it wasn't mapped at creation, it leads the DataTrigger managing that property to fetch the value

The fact that these two implementations are distinct today is causing problems and need to be resolved into onse single code-path.
One difference is that the map raw data to object is done based on read expressions involved in the fetch and the actual properties of the raw data, while the accessor of a property is a lazy operation. But they essentially do the same thing: populate an instance/model level value of an instance's modeled property.

## Flow of a first User-triggered Fetch



### Sample Stack

We're going to assume the following stack to anchor the discussion:

#### Client Data Services Setup

      Main Data Service
        |—— Synchronization Data Service
              |—— WebSocket Data Operation Service,
              |—— Serialized Data Service
              |—— Azure Client OAuth Data Service
              |—— AzureGraphDataService

#### Worker Data Data Sertup
      Main Data Service
        |—— GCP Secret Manager Data Service
        |—— PostgreSQL Service


Within mainService.fetchData(aDataQuery), mainService creates a readOperation out of the DataQuery passed to it. That readOperation will be dispatched to RawDataServices to be handled and eventually dispatch a symetric readCompletedOperation.

The main aspects of a read operation are its target (a DataOperation is a subclass of MutableEvent, itself subclassing Events) which is an ObjectDescriptor / Type, and the criteria that describes what kind of instances of that type should be read. A DataQuery's criteria created by a user of the data layer should always be in instance/model level properies and value. Criteria can use parameters within their expressions, and those parameters' values can be simple types like boolean, numbers or strings, as well as full data model types' instances, which would had to be fetched earlier.

### Mapping Read Operation's model-level criteria to raw data level

RawDataServices only gets dispatched read operations for type they support. Within RawDataService's subclasses implementation of handleReadOperation, the instance-level criteria has to be mapped to that service's raw data shape in order to return the results of that read. For example, an http-based RawDataService will ultimtely map the read operation to an HTTP request, a PostgreSQL Data Service will map it to SQL statement sent to the database, and something like the WebSocketDataOperationService will propagate the read operation to its associated worker.

### From Data Instance to RawDataService-specific Primary key

For a RawDataService, mapping a criteria with only native type values as paraneters to raw-data level is straightforward. However if Data Instances are involved, a RawDataService needs to know the value of thoseinstances' raw data primary key within the data source that data servics fronts. And that is only possible if a RawDataService is the one that fetched that object in the first place.

If the read operation comes frome a DataQuery performed in the same process as where the RawDataService runs, if that RawDataService did fetch that instance, it will have a snapshot in memeory for that instance, and therefore the primary key value for that object. However, if the RawDataService handling that read operation lives in a different process, it absolutely needs those values as part of the read operation itself, which is critical to have serverless and stateless operations in the back-end.

### Example Stack

In

### Flow of a first fetch that doesn't involve data instances as paraneters

* Moving Data From User to Storage / From Presentation to persistence

  * Definition
  * There's only one reality
  * Undertanding before proposing
* High Stakes

  * Data Impacts Performance
  * Data Impacts User Experience
  * Data Impact on Maintainability
* Approaches to Data Modeling

  * Classic Object Oriented Inheritance
  * Prototype-Based Inheritance

## Data Modeling With Mod

- ObjectDescriptors
- PropertyDescriptors
-
