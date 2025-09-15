var Criteria = require("mod/core/criteria").Criteria,
    DataQuery = require("mod/data/model/data-query").DataQuery,
    ModuleObjectDescriptor = require("mod/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("mod/core/module-reference").ModuleReference,
    ObjectDescriptor = require("mod/data/model/object-descriptor").ObjectDescriptor,
    PropertyDescriptor = require("mod/core/meta/property-descriptor").PropertyDescriptor,
    WeatherReportType = require("./logic/model/weather-report").Type,
    WeatherReport = require("./logic/model/weather-report").WeatherReport,
    serialize = require("mod/core/serialization/serializer/montage-serializer").serialize,
    deserialize = require("mod/core/serialization/deserializer/montage-deserializer").deserialize;

var movieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject;

describe("A DataQuery", function() {

    it("can be created", function () {
        expect(new DataQuery()).toBeDefined();
    });

    it("initially has no type", function () {
        expect(new DataQuery().type).toBeUndefined();
    });

    it("preserves its type", function () {
        var query = new DataQuery(),
            type = new ObjectDescriptor(),
            name = "String" + Math.random();
        type.name = name;
        query.type = type;
        expect(query.type).toBe(type);
        expect(query.type.name).toEqual(name);
    });

    xit("initially has no criteria", function () {
        expect(new DataQuery().criteria).toBeUndefined();
    });

    xit("preserves its criteria", function () {
        var query = new DataQuery(),
            criteria = {a: Math.random(), b: Math.random(), c: Math.random()};
        query.criteria.a = criteria.a;
        query.criteria.b = criteria.b;
        query.criteria.c = criteria.c;
        expect(query.criteria).toEqual(criteria);
    });





    describe("can serialize and deserialize", function () {

        var dataExpression = "city = $city && unit = $unit && country = $country";
        var dataParameters = {
            city: 'San-Francisco',
            country: 'us',
            unit: 'imperial'
        }, dataType, dataCriteria, dataQuerySource, dataQueryJson, dataQueryJsonObj;

        it("with constructor as type", function (done) {

            dataType = WeatherReport;
            dataCriteria = new Criteria().initWithExpression(dataExpression, dataParameters);

            dataQuerySource  = DataQuery.withTypeAndCriteria(dataType, dataCriteria);
            dataQueryJson = serialize(dataQuerySource, require);

            try {
                expect(dataQueryJson).toBeDefined();
                var dataQueryJsonObj = JSON.parse(dataQueryJson);
                expect(dataQueryJsonObj.weatherreport).toBeDefined();
                expect(dataQueryJsonObj.weatherreport.object).toBe('spec/data/logic/model/weather-report');

                expect(dataQueryJsonObj.criteria).toBeDefined();
                expect(dataQueryJsonObj.criteria.prototype).toBe('mod/core/criteria');
                var dataQuery = deserialize(dataQueryJson, require).then(function (dataQueryFromJson) {
                    expect(dataQueryJson).toBeDefined();
                    done();
                }, function (err) {
                    fail(err);
                });

            } catch (err) {
                fail(err);
            }
        });

        it("with programmatic objectDescriptor as type", function (done) {

            var weatherReportReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/weather-report", require),
                weatherReportDescriptor = new ModuleObjectDescriptor().initWithModuleAndExportName(weatherReportReference, "WeatherReport");

            weatherReportDescriptor.addPropertyDescriptor(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("title", weatherReportDescriptor, 1));

            dataType = weatherReportDescriptor;
            dataCriteria = new Criteria().initWithExpression(dataExpression, dataParameters);

            dataQuerySource  = DataQuery.withTypeAndCriteria(dataType, dataCriteria);
            dataQueryJson = serialize(dataQuerySource, require);
            try {
                expect(dataQueryJson).toBeDefined();
                var dataQueryJsonObj = JSON.parse(dataQueryJson);
                expect(dataQueryJsonObj.WeatherReport).toBeDefined();
                expect(dataQueryJsonObj.WeatherReport.prototype).toBeDefined();
                // expect(dataQueryJsonObj.weatherreport.object).toBe('spec/data/logic/model/weather-report');

                expect(dataQueryJsonObj.criteria).toBeDefined();
                expect(dataQueryJsonObj.criteria.prototype).toBe('mod/core/criteria');

                deserialize(dataQueryJson, require).then(function (dataQueryFromJson) {
                    expect(dataQueryFromJson).toBeDefined();
                    done();
                }, function (err) {
                    fail(err);
                });

            } catch (err) {
                fail(err);
            }

        });

        it("with mjson objectDescriptor as type", function (done) {
            dataType = movieDescriptor;
            dataCriteria = new Criteria().initWithExpression(dataExpression, dataParameters);

            dataQuerySource  = DataQuery.withTypeAndCriteria(dataType, dataCriteria);
            dataQueryJson = serialize(dataQuerySource, require);

            try {
                expect(dataQueryJson).toBeDefined();
                dataQueryJsonObj = JSON.parse(dataQueryJson);
                expect(dataQueryJsonObj.root.values.type["@"]).toBe(movieDescriptor.name);

                expect(dataQueryJsonObj.criteria).toBeDefined();
                expect(dataQueryJsonObj.criteria.prototype).toBe('mod/core/criteria');

                deserialize(dataQueryJson, require).then(function (dataQueryFromJson) {
                    expect(dataQueryFromJson).toBeDefined();
                    expect(dataQueryFromJson.type).toBe(movieDescriptor);
                    done();
                }, function (err) {
                    fail(err);
                });

            } catch (err) {
                fail(err);
            }

        });


    });
});
