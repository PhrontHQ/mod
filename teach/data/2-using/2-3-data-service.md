# Data Service

DataServices are responsible for creating, fetching, updating, deleting and saving DataObjecs

DataService.mainService is how end-modders (developers who work on end-mods, aka as applications which are the same for every user) use to use those features.

An abstract subclass, RawDataService, is used within Mod data to facilitate the implementation of specific sources of data, such as a PostgreSQL database, a json file, a REST API, etc... Unless one needs to create a new kind of RawDataService to use a new kind of data source, they're not typically used directly by end-mods developers

