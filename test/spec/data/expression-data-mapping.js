var ExpressionDataMapping = require("mod/data/service/expression-data-mapping").ExpressionDataMapping,
    CategoryService = require("spec/data/logic/service/category-service").CategoryService,
    CountryService = require("spec/data/logic/service/country-service").CountryService,
    DataService = require("mod/data/service/data-service").DataService,
    DateConverter = require("mod/core/converter/date-converter").DateConverter,
    ModuleObjectDescriptor = require("mod/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("mod/core/module-reference").ModuleReference,
    PlotSummaryService = require("spec/data/logic/service/plot-summary-service").PlotSummaryService,
    PropService = require("spec/data/logic/service/prop-service").PropService,
    Promise = require("mod/core/promise").Promise,
    PropertyDescriptor = require("mod/core/meta/property-descriptor").PropertyDescriptor,
    RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    RawDataTypeMapping = require("mod/data/service/raw-data-type-mapping").RawDataTypeMapping,
    RawForeignValueToObjectConverter = require("mod/data/converter/raw-foreign-value-to-object-converter").RawForeignValueToObjectConverter,
    defaultEventManager = require("mod/core/event/event-manager").defaultEventManager;


var Movie = require("spec/data/logic/model/movie").Movie,
    Category = require("spec/data/logic/model/category").Category,
    Country = require("spec/data/logic/model/country").Country,
    ActionMovie = require("spec/data/logic/model/action-movie").ActionMovie,
    Prop = require("spec/data/logic/model/prop").Prop;

describe("An Expression Data Mapping", function() {

    var categoryConverter,
        categoryMapping,
        categoryModuleReference,
        categoryObjectDescriptor,
        categoryPropertyDescriptor,
        categoryMapping,
        categorySchema,
        categoryService,
        countryConverter,
        countryMapping,
        countryModuleReference,
        countryObjectDescriptor,
        countryPropertyDescriptor,
        countryService,
        dateConverter,
        mainService,
        isFeaturedPropertyDescriptor,
        movieBudgetPropertyDescriptor,
        movieMapping,
        movieModuleReference,
        movieObjectDescriptor,
        movieReleaseDatePropertyDescriptor,
        movieSchema,
        movieSchemaModuleReference,
        movieService,
        actionMovieMapping,
        actionMovieModuleReference,
        actionMovieObjectDescriptor,
        plotSummaryModuleReference,
        plotSummaryObjectDescriptor,
        plotSummaryPropertyDescriptor,
        registrationPromise,
        schemaBudgetPropertyDescriptor,
        schemaIsFeaturedPropertyDescriptor,
        propModuleReference,
        propObjectDescriptor,
        propMoviePropertyDescriptor,
        propsPropertyDescriptor,
        propConverter,
        propService,



    dateConverter = Object.create({}, {
        converter: {
            value: new DateConverter()
        },
        formatString: {
            value: "MM/dd/yyyy"
        },
        convert: {
            value: function (rawValue) {
                return new Date(rawValue);
            }
        },
        revert: {
            value: function (date) {
                this.converter.pattern = this.formatString;
                return this.converter.convert(date);
            }
        }
    });

    DataService.mainService = undefined;
    mainService = new DataService();
    mainService.supportsDataOperation = false;
    mainService.NAME = "Movies";
    defaultEventManager.application.mainService = mainService;
    movieService = new RawDataService();
    movieModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/movie", require);
    movieObjectDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(movieModuleReference, "Movie");
    movieObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("title", movieObjectDescriptor, 1));
    movieObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("id", movieObjectDescriptor, 1));
    movieSchemaModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/schema/logic/movie", require);
    movieSchema = new ModuleObjectDescriptor().initWithModuleAndExportName(movieSchemaModuleReference, "MovieSchema");


    actionMovieModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/action-movie", require);
    actionMovieObjectDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(actionMovieModuleReference, "ActionMovie");
    actionMovieObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("rating", actionMovieObjectDescriptor, 1));
    actionMovieObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("criticScore", actionMovieObjectDescriptor, 1));
    actionMovieObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("compositeRating", actionMovieObjectDescriptor, 1));
    actionMovieObjectDescriptor.parent = movieObjectDescriptor;

    categoryService = new CategoryService();
    categoryModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category", require);
    categoryObjectDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(categoryModuleReference, "Category");
    categoryObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", categoryObjectDescriptor, 1));
    categoryPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("category", movieObjectDescriptor, 1);
    categoryPropertyDescriptor.valueDescriptor = categoryObjectDescriptor;
    movieObjectDescriptor.addPropertyDescriptor(categoryPropertyDescriptor);
    categorySchemaModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/schema/logic/category", require);
    categorySchema = new ModuleObjectDescriptor().initWithModuleAndExportName(categorySchemaModuleReference, "CategorySchema");
    categoryMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(categoryService, categoryObjectDescriptor, categorySchema);
    categoryMapping.rawDataPrimaryKeys = ["id"];



    countryService = new CountryService();
    countryModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/country", require);
    countryObjectDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(countryModuleReference, "Country");
    countryObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", countryObjectDescriptor, 1));
    countryPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("country", countryObjectDescriptor, 1);
    countryPropertyDescriptor.valueDescriptor = countryObjectDescriptor;
    actionMovieObjectDescriptor.addPropertyDescriptor(countryPropertyDescriptor);


    plotSummaryService = new PlotSummaryService();
    plotSummaryModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/plot-summary", require);
    plotSummaryObjectDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(plotSummaryModuleReference, "PlotSummary");
    plotSummaryObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("summary", plotSummaryObjectDescriptor, 1));
    plotSummaryObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("movie", movieObjectDescriptor, 1));
    plotSummaryPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("plotSummary", movieObjectDescriptor, 1);
    plotSummaryPropertyDescriptor.valueDescriptor = plotSummaryObjectDescriptor;
    movieObjectDescriptor.addPropertyDescriptor(plotSummaryPropertyDescriptor);

    propService = new PropService();
    propModuleReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/prop", require);
    propObjectDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(propModuleReference, "Prop");
    propObjectDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("name", null));
    propMoviePropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("movie", movieObjectDescriptor, -1);
    propMoviePropertyDescriptor.valueDescriptor = propObjectDescriptor;
    propObjectDescriptor.addPropertyDescriptor(propMoviePropertyDescriptor);
    propsPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("props", movieObjectDescriptor, Infinity);
    propsPropertyDescriptor.valueDescriptor = propObjectDescriptor;
    propsPropertyDescriptor.inversePropertyName = "movie";
    movieObjectDescriptor.addPropertyDescriptor(propsPropertyDescriptor);


    schemaBudgetPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("budget", movieSchema, 1);
    movieSchema.addPropertyDescriptor(schemaBudgetPropertyDescriptor);
    movieBudgetPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("budget", movieObjectDescriptor, 1);
    movieBudgetPropertyDescriptor.valueType = "number";
    movieObjectDescriptor.addPropertyDescriptor(movieBudgetPropertyDescriptor);

    movieReleaseDatePropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("releaseDate", movieObjectDescriptor, 1);
    movieObjectDescriptor.addPropertyDescriptor(movieReleaseDatePropertyDescriptor);

    isFeaturedPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("isFeatured", movieObjectDescriptor, 1);
    isFeaturedPropertyDescriptor.valueType = "boolean";
    movieObjectDescriptor.addPropertyDescriptor(isFeaturedPropertyDescriptor);
    schemaIsFeaturedPropertyDescriptor = new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("is_featured", movieSchema, 1);
    schemaIsFeaturedPropertyDescriptor.valueType = "string";
    movieSchema.addPropertyDescriptor(schemaIsFeaturedPropertyDescriptor);

    movieMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(movieService, movieObjectDescriptor, movieSchema);
    movieMapping.addRequisitePropertyName( "title", "category", "budget", "isFeatured", "releaseDate", "id");
    movieMapping.addObjectMappingRule("title", {"<->": "name"});

    movieMapping.addObjectMappingRule("id", {"<->": "id"});


    categoryConverter = new RawForeignValueToObjectConverter().initWithConvertExpression("category_id == $");
    categoryConverter.service = categoryService;
    movieMapping.addObjectMappingRule("category", {
        "<-": "{categoryID: category_id}",
        converter: categoryConverter
    });
    summaryConverter = new RawForeignValueToObjectConverter().initWithConvertExpression("category_id == $");
    summaryConverter.service = plotSummaryService;
    movieMapping.addObjectMappingRule("plotSummary", {
        "<-": "{movie_id: id}",
        converter: summaryConverter,
        inversePropertyName: "movie"
    });
    propConverter = new RawForeignValueToObjectConverter().initWithConvertExpression("category_id == $");
    propConverter.service = propService;
    movieMapping.addObjectMappingRule("props", {
        "<-": "{}",
        converter: propConverter
    });
    movieMapping.addRawDataMappingRule("category_id", {"<-": "category.id"});
    movieMapping.addObjectMappingRule("releaseDate", {
        "<->": "release_date",
        converter: dateConverter
    });
    movieMapping.addObjectMappingRule("budget", {"<-": "budget"});
    movieMapping.addObjectMappingRule("isFeatured", {"<-": "is_featured"});
    movieMapping.addRawDataMappingRule("budget", {"<-": "budget"});
    movieMapping.addRawDataMappingRule("is_featured", {"<-": "isFeatured"});
    movieMapping.addRawDataMappingRule("summary", {"<-": "plotSummary.summary"});
    movieService.addMappingForType(movieMapping, movieObjectDescriptor);
    movieMapping.rawDataPrimaryKeys = ["id"];
    categoryMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(categoryService, categoryObjectDescriptor);
    categoryMapping.addObjectMappingRule("name", {"<->": "name"});
    categoryMapping.addRequisitePropertyName("name");
    categoryService.addMappingForType(categoryMapping, categoryObjectDescriptor);

    actionMovieMapping = new ExpressionDataMapping().initWithServiceObjectDescriptorAndSchema(movieService, actionMovieObjectDescriptor);
    actionMovieMapping.addObjectMappingRule("rating", {"<-": "fcc_rating.toUpperCase()"});
    actionMovieMapping.addObjectMappingRule("criticScore", {"<-": "score"});
    actionMovieMapping.addObjectMappingRule("compositeRating", {"<-": "{rating: mappedRating, score: mappedScore}"});
    actionMovieMapping.addRawDataMappingRule("fcc_rating", {"<-": "rating.toLowerCase()"});
    actionMovieMapping.addRawDataMappingRule("mappedRating", {"<-": "rating"});
    actionMovieMapping.addRawDataMappingRule("mappedScore", {"<-": "criticScore"});
    actionMovieMapping.addRequisitePropertyName("country", "rating");
    countryConverter = new RawForeignValueToObjectConverter().initWithConvertExpression("country_id");
    countryConverter.revertExpression = "id";
    countryConverter.owner = actionMovieMapping;
    actionMovieMapping.addObjectMappingRule("country", {
        "<-": "country_id",
        converter: countryConverter
    });
    actionMovieMapping.addRawDataMappingRule("country_id", {"<-": "country.id"});
    movieService.addMappingForType(actionMovieMapping, actionMovieObjectDescriptor);


    it("can be created", function () {
        expect(new ExpressionDataMapping()).toBeDefined();
    });

    registrationPromise = Promise.all([
        mainService.registerChildService(movieService, [movieObjectDescriptor, actionMovieObjectDescriptor]),
        mainService.registerChildService(categoryService, categoryObjectDescriptor),
        mainService.registerChildService(countryService, countryObjectDescriptor),
        mainService.registerChildService(plotSummaryService, plotSummaryObjectDescriptor),
        mainService.registerChildService(propService, propObjectDescriptor)
    ]);

    it("properly registers the object descriptor type to the mapping object in a service", function (done) {
        return registrationPromise.then(function () {
            expect(movieService.parentService).toBe(mainService);
            expect(movieService.mappingForType(movieObjectDescriptor)).toBe(movieMapping);
            done();
        });
    });

    it("can create the correct number of mapping rules", function () {
        expect(Object.keys(movieMapping.objectMappingRules).length).toBe(8);
        expect(Object.keys(movieMapping.rawDataMappingRules).length).toBe(7);
    });

    it("can inherit rawDataPrimaryKeys", function () {
        expect(movieMapping.rawDataPrimaryKeys.length).toBe(1);
        expect(actionMovieMapping.rawDataPrimaryKeys.length).toBe(1);
        actionMovieMapping.rawDataPrimaryKeys = ["id", "category_id"];
        expect(movieMapping.rawDataPrimaryKeys.length).toBe(1);
        expect(actionMovieMapping.rawDataPrimaryKeys.length).toBe(2);
    });

    it("can map raw data to object properties", function (done) {
        return registrationPromise.then(function () {
            var movie = {},
                data = {
                    name: "Star Wars",
                    category_id: 1,
                    budget: "14000000.00",
                    is_featured: "true",
                    release_date: "05/25/1977"
                };
            return movieMapping.mapRawDataToObject(data, movie).then(function () {
                expect(movie.title).toBe("Star Wars");
                expect(movie.category).toBeDefined();
                expect(movie.category && movie.category.name === "Action").toBeTruthy();
                expect(typeof movie.releaseDate === "object").toBeTruthy();
                expect(movie.releaseDate.getDate()).toBe(25);
                expect(movie.releaseDate.getMonth()).toBe(4);
                expect(movie.releaseDate.getFullYear()).toBe(1977);
                done();
            });
        });
    });

    it("can map raw data to object properties with inheritance", function (done) {
        var movie = new ActionMovie(),
            data = {
                name: "Star Wars",
                category_id: 1,
                budget: "14000000.00",
                is_featured: "true",
                release_date: "05/25/1977",
                fcc_rating: "pg",
                country_id: 1
            };

        return actionMovieMapping.mapRawDataToObject(data, movie).then(function () {
            //Properties defined in parent descriptor
            expect(movie.title).toBe("Star Wars");
            expect(movie.budget).toEqual(14000000);

            //Properties defined in own descriptor
            expect(movie.country).toBeDefined();
            done();
        });
    });

    it("can map inverse in mapping for fetch with updateObjectProperties", function (done) {
        var movie = mainService.createDataObject(movieObjectDescriptor),
            data = {
                name: "Star Wars",
                category_id: 1,
                budget: "14000000.00",
                is_featured: "true",
                release_date: "05/25/1977",
                fcc_rating: "pg",
                country_id: 1
            };

        return actionMovieMapping.mapRawDataToObject(data, movie).then(function () {
            //Properties defined in parent descriptor
            return mainService.updateObjectProperties(movie, "plotSummary");
        }).then(function () {
            expect(movie.plotSummary).toBeDefined();
            expect(movie.plotSummary.movie).toBe(movie);
            done();
        });
    });

    it("can map inverse on propertyDescriptor for fetch with updateObjectProperties", function (done) {
        var movie = mainService.createDataObject(movieObjectDescriptor),
            data = {
                name: "Star Wars",
                category_id: 1,
                budget: "14000000.00",
                is_featured: "true",
                release_date: "05/25/1977",
                fcc_rating: "pg",
                country_id: 1
            };

        return movieMapping.mapRawDataToObject(data, movie).then(function () {
            //Properties defined in parent descriptor
            return mainService.updateObjectProperties(movie, "props");
        }).then(function () {
            expect(movie.props).toBeDefined();
            expect(Array.isArray(movie.props)).toBe(true);
            expect(movie.props[0].movie).toBe(movie);
            done();
        });
    });

    it("can automatically convert raw data to the correct type", function (done) {
        var movie = {},
            data = {
                name: "Star Wars",
                category_id: 1,
                budget: "14000000.00",
                is_featured: "true",
                release_date: "05/25/1977"
            };
        return movieMapping.mapRawDataToObject(data, movie).then(function () {
            expect(typeof movie.budget === "number").toBeTruthy();
            expect(typeof movie.category === "object").toBeTruthy();
            expect(typeof movie.isFeatured === "boolean").toBeTruthy();
            expect(typeof movie.title === "string").toBeTruthy();
            done();
        });
    });

    it("can map objects to raw data", function (done) {
        var category = new Category(),
            movie = mainService.createDataObject(movieObjectDescriptor),
            data = {};
        category.name = "Action";
        category.id = 1;

        mainService.recordDataIdentifierForObject(categoryService.dataIdentifierForTypePrimaryKey(categoryObjectDescriptor, category.id), category)

        movie.title = "Star Wars";
        movie.budget = 14000000.00;
        movie.isFeatured = true;
        movie.releaseDate = new Date(1977, 4, 25);
        movie.category = category;
        movieMapping.mapObjectToRawData(movie, data).then(function () {
            expect(data.name).toBe("Star Wars");
            expect(data.budget).toBe("14000000");
            expect(data.is_featured).toBe("true");
            expect(data.release_date).toBe("05/25/1977");
            expect(data.category_id).toBe(1);
            done();
        });
    });

    it("can map objects to raw data with untripped trigger", function (done) {
        var snapshot = {
                id: 1
            },
            data = {},
            movie = movieService.getDataObject(movieObjectDescriptor, data);

        movieMapping.mapObjectToRawData(movie, data).then(function () {
            expect(data.summary).toBeDefined();
            done();
        });
    });

    it("can map objects to raw data with tripped trigger", function (done) {
        var snapshot = {
                id: 1
            },
            movie = movieService.rootService.createDataObject(movieObjectDescriptor),
            category = new Category(),
            movieTitle = "The Social Network";


        var title = movie.title; //Trigger Title Getter
        movie.title = movieTitle;
        movie.id = 2;
        category.name = "A Category";
        category.id = 4;
        // movie.category = category;

        movieService.saveDataObject(movie).then(function (data) {
            expect(movie.title).toBe(movieTitle);
            done();
        });
    });

    it("can map objects to raw data with inheritance", function (done) {
        var country = new Country(),
            movie = {
                title: "Star Wars",
                budget: 14000000.00,
                isFeatured: true,
                releaseDate: new Date(1977, 4, 25),
                country: country,
                rating: "PG"
            },
            data = {};

            country.id = 1;
        actionMovieMapping.mapObjectToRawData(movie, data).then(function () {
            //Properties defined in parent descriptor
            expect(data.name).toBe("Star Wars");
            expect(data.budget).toBe("14000000");
            expect(data.is_featured).toBe("true");
            expect(data.release_date).toBe("05/25/1977");
            //Properties defined in own descriptor
            expect(data.fcc_rating).toBe("pg");
            expect(data.country_id).toEqual(1);
            done();
        });
    });

    it("can map object to criteria source for property", function (done) {
        return registrationPromise.then(function () {
            var movie = new Movie(),
                data = {};
                movie.criticScore = 94;
                movie.rating = "PG";
            return actionMovieMapping.mapObjectToCriteriaSourceForProperty(movie, data, "compositeRating").then(function () {
                expect(data.mappedScore).toBe(94);
                expect(data.mappedRating).toBe("PG");
                done();
            });
        });
    });

    it("can automatically revert objects to raw data of the correct type", function (done) {
        var movie = {
                title: "Star Wars",
                budget: 14000000.00,
                isFeatured: true
            },
            data = {};
        movieMapping.mapObjectToRawData(movie, data).then(function () {
            expect(typeof data.budget === "string").toBeTruthy();
            expect(typeof data.is_featured === "string").toBeTruthy();
            expect(typeof data.name === "string").toBeTruthy();
            done();
        });
    });




});
