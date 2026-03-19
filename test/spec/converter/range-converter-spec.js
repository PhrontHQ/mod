/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var ISO8601DurationRangeStringToDurationRangeConverter = require("mod/core/converter/i-s-o-8601-duration-range-string-to-duration-range-converter").ISO8601DurationRangeStringToDurationRangeConverter,
    RFC3339UTCRangeStringToCalendarDateRangeConverter = require("mod/core/converter/r-f-c-3339-u-t-c-range-string-to-calendar-date-range-converter").RFC3339UTCRangeStringToCalendarDateRangeConverter,
    RFC3339UTCRangeStringToDateRangeConverter = require("mod/core/converter/r-f-c-3339-u-t-c-range-string-to-date-range-converter").RFC3339UTCRangeStringToDateRangeConverter,
    CalendarDate = require("mod/core/date/calendar-date").CalendarDate,
    Duration = require("mod/core/duration").Duration,
    Range = require("mod/core/range").Range,
    TimeZone = require("mod/core/date/time-zone").TimeZone;


describe("converter-spec", function () {

    var ISO8601stringToDurationConverter,
        RFC3339stringToDateRangeConverter, 
        RFC3339stringToCalendarDateRangeConverter,
        EST_IDENTIFIER = "Eastern Standard Time",
        PST_IDENTIFIER = "Pacific Standard Time",
        range, easternTimeZone, westernTimeZone;

    beforeAll(function (done) {
        Promise.all([
            TimeZone.withIdentifier(EST_IDENTIFIER),
            TimeZone.withIdentifier(PST_IDENTIFIER)
        ]).then(function (results) {
            easternTimeZone = results[0];
            westernTimeZone = results[1];
            done();
        });
    });

    beforeEach(function () {
        ISO8601stringToDurationConverter = new ISO8601DurationRangeStringToDurationRangeConverter();
        RFC3339stringToDateRangeConverter = new RFC3339UTCRangeStringToDateRangeConverter();
        RFC3339stringToCalendarDateRangeConverter = new RFC3339UTCRangeStringToCalendarDateRangeConverter();
        range = new Range(new Date("03/17/2023"), new Date("04/18/2023"));
    });


    describe("Test ISO8601 Formatters", function () {
        it("should format a range of durations", function () {
            let twoAndAHalfHours = new Duration(0, 0, 0, 0, 2, 30, 0, 0, 0, 0, 0),
                fourHours = new Duration(0, 0, 0, 0, 4, 0, 0, 0, 0, 0),
                oneYear = new Duration(1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
                twoYears = new Duration(2, 0, 0, 0, 4, 0, 0, 0, 0, 0),
                multiValueA = new Duration(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
                multValueB = new Duration(2, 3, 4, 5, 6, 7, 8, 9, 10, 11),
                range = new Range(twoAndAHalfHours, fourHours);

            result = ISO8601stringToDurationConverter.revert(range);
            expect(result).toBe('[PT2H30M,PT4H]');

            range = new Range(oneYear, twoYears);
            result = ISO8601stringToDurationConverter.revert(range);
            expect(result).toBe('[P1Y,P2YT4H]');


            range = new Range(multiValueA, multValueB);
            result = ISO8601stringToDurationConverter.revert(range);
            expect(result).toBe('[P1Y2M3W4DT5H6M7S,P2Y3M4W5DT6H7M8S]');

        });

        it("should parse range of durations", function () {
            let range = ISO8601stringToDurationConverter.convert("[P1Y2M3W4DT5H6M7S,P2Y3M4W5DT6H7M8S]");

            expect(range.begin.years).toBe(1);
            expect(range.begin.months).toBe(2);
            expect(range.begin.weeks).toBe(3);
            expect(range.begin.days).toBe(4);
            expect(range.begin.hours).toBe(5);
            expect(range.begin.minutes).toBe(6);
            expect(range.begin.seconds).toBe(7);

            expect(range.end.years).toBe(2);
            expect(range.end.months).toBe(3);
            expect(range.end.weeks).toBe(4);
            expect(range.end.days).toBe(5);
            expect(range.end.hours).toBe(6);
            expect(range.end.minutes).toBe(7);
            expect(range.end.seconds).toBe(8);
        });

    });

    


    // string formatters
    describe("Test RFC Formatters", function () {

        describe("RFC3339UTCRangeStringToDateRangeConverter", function () {
            it("should format a date range in RFC3339 format", function () {
                //YYYY-MM-DDTHH:mm:ss±hh:mm
                //https://datatracker.ietf.org/doc/html/rfc3339
                var result = RFC3339stringToDateRangeConverter.revert(range);
                expect(result).toBe("[2023-03-17T05:00:00.000Z,2023-04-18T05:00:00.000Z]");
            });

            it("should parse a date range from YYYY-MM-DD HH:mm:ss.SSSZ", function () {
                //"[\"2026-03-18 15:08:17.297-05\",\"2026-03-18 16:08:17.297-05\"]"
                var result = RFC3339stringToDateRangeConverter.convert("[2025-02-14 15:08:17.297-05,2025-02-14 16:08:17.297-05]");
                expect(result.begin.getFullYear()).toBe(2025);
                expect(result.begin.getMonth()).toBe(1);
                expect(result.begin.getDate()).toBe(14);
                expect(result.begin.getHours()).toBe(14);
                expect(result.begin.getMinutes()).toBe(8);
                expect(result.begin.getSeconds()).toBe(17);
                expect(result.begin.getMilliseconds()).toBe(297);

                expect(result.end.getFullYear()).toBe(2025);
                expect(result.end.getMonth()).toBe(1);
                expect(result.end.getDate()).toBe(14);
                expect(result.end.getHours()).toBe(15);
                expect(result.end.getMinutes()).toBe(8);
                expect(result.end.getSeconds()).toBe(17);
                expect(result.end.getMilliseconds()).toBe(297);
            });

            it("should parse a date date range from YYYY-MM-DD HH:mm:ss.SSSZ with internal quotes", function () {
                //"[\"2026-03-18 15:08:17.297-05\",\"2026-03-18 16:08:17.297-05\"]"
                var result = RFC3339stringToDateRangeConverter.convert("[\"2026-03-18 15:08:17.297-05\",\"2026-03-18 16:08:17.297-05\"]");
                expect(result.begin.getFullYear()).toBe(2026);
                expect(result.begin.getMonth()).toBe(2);
                expect(result.begin.getDate()).toBe(18);
                expect(result.begin.getHours()).toBe(15);
                expect(result.begin.getMinutes()).toBe(8);
                expect(result.begin.getSeconds()).toBe(17);
                expect(result.begin.getMilliseconds()).toBe(297);

                expect(result.end.getFullYear()).toBe(2026);
                expect(result.end.getMonth()).toBe(2);
                expect(result.end.getDate()).toBe(18);
                expect(result.end.getHours()).toBe(16);
                expect(result.end.getMinutes()).toBe(8);
                expect(result.end.getSeconds()).toBe(17);
                expect(result.end.getMilliseconds()).toBe(297);
            });
        })


        describe("RFC3339UTCRangeStringToCalendarDateRangeConverter", function () {
            it("should format a calendar date range in RFC3339 format", function () {
                //YYYY-MM-DDTHH:mm:ss±hh:mm
                //https://datatracker.ietf.org/doc/html/rfc3339
                var begin = CalendarDate.withUTCComponentValuesInTimeZone(2024, 8, 9, 3, 30, 15, 250),
                    end = CalendarDate.withUTCComponentValuesInTimeZone(2024, 8, 10, 2, 30, 15, 250),
                    range = Range(begin, end),
                    result = RFC3339stringToCalendarDateRangeConverter.revert(range);
                expect(result).toBe("[2024-08-09T03:30:15.000Z,2024-08-10T02:30:15.000Z]");
            });


            it("should parse a calendar date range from YYYY-MM-DD HH:mm:ss.SSSZ", function () {
                RFC3339stringToCalendarDateRangeConverter.timeZone = easternTimeZone;
                let result = RFC3339stringToCalendarDateRangeConverter.convert("[2024-08-09T09:30:15.000Z,2024-08-10T10:30:15.000Z]");

                    expect(result.begin.year).toBe(2024);
                    expect(result.begin.month).toBe(8);
                    expect(result.begin.day).toBe(9);
                    expect(result.begin.hour).toBe(5); //Adjusted from UTC to eastern timezone
                    expect(result.begin.minute).toBe(30);
                    expect(result.begin.second).toBe(15);

                    expect(result.end.year).toBe(2024);
                    expect(result.end.month).toBe(8);
                    expect(result.end.day).toBe(10);
                    expect(result.end.hour).toBe(6); //Adjusted from UTC to eastern timezone
                    expect(result.end.minute).toBe(30);
                    expect(result.end.second).toBe(15);

            });

            it("should parse a calendar date range from YYYY-MM-DD HH:mm:ss.SSSZ with internal quotes", function () {
                //"[\"2026-03-18 15:08:17.297-05\",\"2026-03-18 16:08:17.297-05\"]"
                RFC3339stringToCalendarDateRangeConverter.timeZone = easternTimeZone;
                let result = RFC3339stringToCalendarDateRangeConverter.convert("[\"2024-08-09T09:30:15.000Z\",\"2024-08-10T10:30:15.000Z\"]");
                    expect(result.begin.year).toBe(2024);
                    expect(result.begin.month).toBe(8);
                    expect(result.begin.day).toBe(9);
                    expect(result.begin.hour).toBe(5); //Adjusted from UTC to eastern timezone
                    expect(result.begin.minute).toBe(30);
                    expect(result.begin.second).toBe(15);

                    expect(result.end.year).toBe(2024);
                    expect(result.end.month).toBe(8);
                    expect(result.end.day).toBe(10); 
                    expect(result.end.hour).toBe(6); //Adjusted from UTC to eastern timezone
                    expect(result.end.minute).toBe(30);
                    expect(result.end.second).toBe(15);
            });

            it("should dynamically adjust timeZone", function () {
                //"[\"2026-03-18 15:08:17.297-05\",\"2026-03-18 16:08:17.297-05\"]"
                RFC3339stringToCalendarDateRangeConverter.timeZone = easternTimeZone;
                let result = RFC3339stringToCalendarDateRangeConverter.convert("[\"2024-08-09T09:30:15.000Z\",\"2024-08-10T10:30:15.000Z\"]");
                    expect(result.begin.year).toBe(2024);
                    expect(result.begin.month).toBe(8);
                    expect(result.begin.day).toBe(9);
                    expect(result.begin.hour).toBe(5); //Adjusted from UTC to eastern timezone
                    expect(result.begin.minute).toBe(30);
                    expect(result.begin.second).toBe(15);

                    expect(result.end.year).toBe(2024);
                    expect(result.end.month).toBe(8);
                    expect(result.end.day).toBe(10); 
                    expect(result.end.hour).toBe(6); //Adjusted from UTC to eastern timezone
                    expect(result.end.minute).toBe(30);
                    expect(result.end.second).toBe(15);

                RFC3339stringToCalendarDateRangeConverter.timeZone = westernTimeZone;

                    result = RFC3339stringToCalendarDateRangeConverter.convert("[\"2024-08-09T09:30:15.000Z\",\"2024-08-10T10:30:15.000Z\"]");
                    expect(result.begin.year).toBe(2024);
                    expect(result.begin.month).toBe(8);
                    expect(result.begin.day).toBe(9);
                    expect(result.begin.hour).toBe(2); //Adjusted from UTC to eastern timezone
                    expect(result.begin.minute).toBe(30);
                    expect(result.begin.second).toBe(15);

                    expect(result.end.year).toBe(2024);
                    expect(result.end.month).toBe(8);
                    expect(result.end.day).toBe(10); 
                    expect(result.end.hour).toBe(3); //Adjusted from UTC to eastern timezone
                    expect(result.end.minute).toBe(30);
                    expect(result.end.second).toBe(15);
            });
        })



    });

    


});

