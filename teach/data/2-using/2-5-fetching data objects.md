# Fetching Data Objects

Concepts

### DataQuery

A DataQuery describes the data that one want to read from the sources of data configured to be used by an application, using the following properties

* type: The type of objects one want to fetch, an ObjectDescriptor, UserSession for example, and it can be augmented with a Criteria object to set conditions on objects.
* criteria: an instance of Criteria, describes the set of conditions on the type of object fetched that must be true to be included in the results of the query.
* orderings: an array of DataOrdering objects (mod/data/model/data-ordering.js) which indicate how the fetched data are expected to be ordered.
* readExpressions: An array of frb expressions describing properties and (nested) relationships that should be prefetched on objects returned by the dtaa query
* fetchLimit: The maximum amount of data to be returned by the query

### Criteria

A criteria represents logical conditions on object's properties and relationships. They can be used to filter collections of objects in memory, or in storage via DataQuery, using the following properties:

* expression: an frb expression ( see mod/core/frb/README.html)
* parameters: an object, which can be a string of a number, that introduces the ability for templating dynamic values in the expression. The paranters object is represented in the expression with the $ sign.

### DataStream <- DataService.mainService.fetchData(aDataQuery)

This DataService method takes aDataQuery as argument and returns a promise-like object, a DataStream, as querying a remote data source is by nature asynchronous.

A DataStream has the following properties:

* query: the DataQuery instance passed to fetchData()
* data: an array containing the results

When results are available, then the promise-like object resolves with DataStream.data.

### Code:

##### Require the file containing the the class's Object Descriptor:

const UserSessionDescriptor = require("mod/data/model/app/user-session.mjson").montageObject;

##### Require DataQuery and Criteria:

const {DataQuery} = require("mod/data/model/data-query");
const {Criteria} = require("mod/data/core/criteria");

##### Create a DataQuery without criteria:

1. let aDataQuery = DataQuery.withTypeAndCriteria(UserSessionDescriptor)

##### Create a DataQuery with a criteria:

To query active UserSessions:

let activeUserSessionCriteria = Criteria.withExpression(/*expression*/"connectionTimeRange.contains($)", /**parameters**/Date.date)

let activeUserSessionDataQuery = DataQuery.withTypeAndCriteria(UserSessionDescriptor, activeUserSessionCriteria);

DataService.mainService.fetchData(activeUserSessionDataQuery)

.then((activeUserSessions) => {

console.log("activeUserSessions:", activeUserSessions);

});

### Accessing Data Object Properties

When an object is fetched, if no readExpressions are specified on the data query, all properties, except relationships, will be fetched. If readExpressions are set, only those will be fetched. If readExpressions contain relationships, those will be fetched such that when the Promise-like DataStream resolves, the values corresponding to those readExpressions will be available on the returned object.

If one access a property on an object that wasn't already fetched, it will return undefined immediately and trigger an internal fetch of that property of that object. Which is working well with bindings that observe properties involved and will automatically react when the fetched value is back and assigned by the framework to that object's property.

If one needs to control when one or more property's value are fetched, you can use:

DataService.mainService.getObjectProperty(aUserSession, "identity")

.then(() => {

console.log("aUserSession.identity is fetched: ", aUserSession.identity);

})

or to do so with multiple properties in one shot:

DataService.mainService.getObjectProperty(aUserSession, ["identity", "connectionTimeRange", "environment"] )

.then(() => {

console.log("aUserSession properties are fetched: ", aUserSession.identity);

})
