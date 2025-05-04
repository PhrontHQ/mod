# Data Service

DataServices are responsible for creating, fetching, updating, deleting and saving DataObjecs

DataService.mainService is what an application uses to use those features.

A subclass, RawDataService is used within Mod data to facilitate the implementation of specific sources of data. A PostgreSQL database, a json file, a REST API, etc... Unless one needs to create a new kind of RawDataService in Mod to use a new kind of data source, they're not typically used diretly.
