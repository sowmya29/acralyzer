/*
 Copyright 2013 Kevin Gaudin (kevin.gaudin@gmail.com)

 This file is part of Acralyzer.

 Acralyzer is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Acralyzer is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with Acralyzer.  If not, see <http://www.gnu.org/licenses/>.
 */
(function(acralyzerConfig,angular,acralyzer,acralyzerEvents) {
    "use strict";

    function ReportsBrowserCtrl($scope, ReportsStore, $routeParams) {
        if($routeParams.app) {
            console.log("ReportsBrowser: Direct access to app " + $routeParams.app);
            $scope.acralyzer.setApp($routeParams.app);
        } else {
            console.log("ReportsBorwser: Access to default app " + acralyzerConfig.defaultApp);
            $scope.acralyzer.setApp(acralyzerConfig.defaultApp);
        }

        console.log("Init ReportsBrowserCtrl");
        $scope.reportsCount = 15;
        $scope.previousStartKeys = [];
        $scope.selectedReport = "";
        $scope.startKey = null;
        $scope.nextKey = null;
        $scope.startNumber = 1;
        $scope.endNumber = $scope.reportsCount;
        $scope.fullSearch = false;
        $scope.loading = true;
        $scope.noFilter = { value: "false", label: "No filter"};
        $scope.noFilterValue = { value: "false", label: "All values"};
        $scope.availableFilters = [
            $scope.noFilter,
            {value: "appver", label: "Application version"},
            {value: "androidver", label: "Android version"}
        ];
        $scope.filterName = $scope.noFilter;
        $scope.filterValue = $scope.noFilterValue;

        $scope.filterValues = [];


        $scope.getNextPage = function() {
            $scope.previousStartKeys.push($scope.startKey);
            $scope.startKey = $scope.nextKey;
            $scope.getData();
        };

        $scope.getPreviousPage = function() {
            $scope.nextKey = null;
            $scope.startKey = $scope.previousStartKeys.pop();
            $scope.getData();
        };

        $scope.getData = function() {
            $scope.loading = true;
            var successHandler = function(data) {
                // Success Handler
                console.log("Refresh data for latest reports");
                $scope.reports = data.rows;
                $scope.totalReports = data.total_rows;
                for(var row = 0; row < $scope.reports.length; row++) {
                    $scope.reports[row].displayDate = moment($scope.reports[row].key).fromNow();
                }

                // If there are more rows, here is the key to the next page
                $scope.nextKey =data.next_row ? data.next_row.key : null;
                $scope.startNumber = ($scope.previousStartKeys.length * $scope.reportsCount) + 1;
                $scope.endNumber = $scope.startNumber + $scope.reports.length - 1;
                console.log($scope);
                $scope.loading = false;
            };

            var errorHandler = function(response, getResponseHeaders){
                // Error Handler
                $scope.reports=[];
                $scope.totalReports="";
            };

            if($scope.filterName === $scope.noFilter || $scope.filterValue === $scope.noFilterValue) {
                ReportsStore.reportsList($scope.startKey, $scope.reportsCount, $scope.fullSearch, successHandler, errorHandler);
            } else {
                ReportsStore.filteredReportsList($scope.filterName.value, $scope.filterValue.value,$scope.startKey, $scope.reportsCount, $scope.fullSearch, successHandler, errorHandler);
            }
        };

        $scope.changeFilterValues = function() {

            if($scope.filterName === $scope.noFilter) {
                $scope.filterValue = $scope.noFilterValue;
                $scope.filterValueSelected();
            } else {
                var getFilteredValues;
                if($scope.filterName.value === "androidver") {
                    getFilteredValues = ReportsStore.androidVersionsList;
                } else if ($scope.filterName.value === "appver") {
                    getFilteredValues = ReportsStore.appVersionsList;
                }

                if(getFilteredValues) {
                    getFilteredValues(function(data){
                        console.log("Update filter values");
                        $scope.filterValues.length = 0;
                        $scope.filterValues.push($scope.noFilterValue);
                        for(var row = 0; row < data.rows.length; row++) {
                            $scope.filterValues.push({value:data.rows[row].key[0], label:data.rows[row].key[0]});
                        }
                        $scope.filterValues.sort();
                    });
                }
            }
        };

        $scope.filterValueSelected = function() {
            // reset pagination
            $scope.startKey = null;
            $scope.nextKey = null;
            $scope.previousStartKeys.length = 0;
            $scope.getData();
        };

        $scope.loadReport = function(report) {
            $scope.selectedReport = ReportsStore.reportDetails(report.id, function(data) {
                data.readableUptime = moment.duration(data.uptime, 'seconds').humanize();
                data.formatedCrashDate = moment(data.USER_CRASH_DATE).format('LLL');
                data.formatedTimestamp = moment(data.timestamp).format('LLL');
            });
        };


        $scope.$on(acralyzerEvents.LOGGED_IN, $scope.getData);
        $scope.$on(acralyzerEvents.LOGGED_OUT, $scope.getData);
        $scope.getData();
    }


    acralyzer.controller('ReportsBrowserCtrl', ["$scope", "ReportsStore", "$routeParams", ReportsBrowserCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents);
