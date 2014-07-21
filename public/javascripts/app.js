(function(angular){
    "use strict";

    var app = angular.module('app', []);

    app.directive('message', function () {
        return {
            restrict : 'AE',
            replace : true,
            template : '<div class="message">Updated files to use <strong>{{ message }}</strong></div>',
            link : function (scope, el) {
                $(el).hide();
                scope.$watch('message', function (newVal, oldVal) {
                    if (newVal && newVal !== oldVal) {
                        $(el).fadeIn(300).delay(1500).fadeOut(300);
                    }
                });
            }
        };
    });

    app.directive('addFilePath', function (FilePathService) {
        return {
            restrict : 'AE',
            replace : true,
            templateUrl : 'filepath.html',
            link : function (scope, element) {
                FilePathService.query().then(function (resp) {
                    scope.paths = resp.data.files;

                });

                scope.remove = function (item) {
                    FilePathService.remove(item.id).success(function (resp) {
                        scope.paths = resp.files;
                    });
                };

                scope.add = function (evt) {
                    var path = $(evt.target).closest('.path').find('input').val();
                    if (path) {
                        FilePathService.add(path).success(function (resp) {
                            scope.paths = resp.files;
                            $(element).find('input').val('');
                        });
                    }
                };
            }
        };
    });

    app.filter('removeGroup', function () {
        return function (text) {
            if (text) {
                return text.replace('DRM_', '').replace('_', ' ');
            }
        };
    });

    app.service('FilePathService', function($http){
        this.add = function(path) {
            return $http({
                method : 'POST',
                url : '/filepath',
                data : {path : path }
            });
        };

        this.remove = function(id) {
            return $http({
                method : 'DELETE',
                url : '/filepath/' + id
            });
        };

        this.query = function() {
            return $http({
                method : 'GET',
                url : '/filepath'
            });
        };
    });

    app.service('UserService', function($http, $q){
        this.set = function(name){
            return $http({
                method : 'PUT',
                url : '/users/' + name
            });
        };

        this.query = function() {
            var defer = $q.defer();
            $http({
                method : 'GET',
                url : '/users'
            }).success(function(resp){
                defer.resolve(resp.users);
            });
            return defer.promise;
        };
    });



    app.controller('MainCtrl', function($scope, UserService){
        $scope.title = 'Express';

        UserService.query().then(function (users) {
            $scope.selectedUser = _.findWhere(users, {selected: true}) || { name : 'No user selected' };
            $scope.users = users;
        });

        this.senduser = function(user) {
            UserService.set(user.username).then(function (resp) {
                $scope.message = resp.data.message;
            });
        };
    });

}(window.angular));