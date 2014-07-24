(function(angular){
    "use strict";

    var app = angular.module('app', []);

    app.directive('nlMessage', function () {
        return {
            restrict : 'E',
            replace : true,
            template : '<div class="message {{ message.type }}"><strong>{{ message.message }}</div>',
            link : function (scope, el) {
                $(el).hide();

                scope.$watch('message', function (newVal, oldVal) {
                    if (newVal && newVal !== oldVal) {
                        $(el).fadeIn(300).delay(2000).fadeOut(300);
                    }
                });
            }
        };
    });


    app.directive('nlAddFilePath', ['FilePathService', function (FilePathService) {
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
                        FilePathService.add(path).then(function (files) {
                            scope.paths = files;
                            $(element).find('input').val('');

                        }, function (error) {
                            scope.message = {
                                type: 'error',
                                message : error
                            };
                        });
                    }
                };
            }
        };
    }]);


    app.filter('removeGroup', function () {
        return function (text) {
            if (text) {
                return text.replace('DRM_', '').replace('_', ' ');
            }
        };
    });


    app.service('FilePathService', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
        this.add = function(path) {
            var defer = $q.defer();

            $http({
                method : 'POST',
                url : '/filepath',
                data : {path : path }
            }).success(function(resp){
                if (resp.files.length === 1) {
                    $rootScope.$broadcast('file:first');
                }
                $rootScope.$broadcast('file:new');
                defer.resolve(resp.files);
            }).error(function (msg) {
                defer.reject(msg);
            });

            return defer.promise;
        };

        this.remove = function(id) {
            return $http({
                method : 'DELETE',
                url : '/filepath/' + id
            }).success(function () {
                $rootScope.$broadcast('file:remove');
            });
        };

        this.query = function() {
            return $http({
                method : 'GET',
                url : '/filepath'
            });
        };
    }]);


    app.service('UserService', function($http, $q){
        this.update = function(user){
            var defer = $q.defer();
            if (user) {
                $http({
                    method : 'PUT',
                    url : '/users/' + user.username,
                    data : user
                }).success(function (resp) {
                    defer.resolve(resp);
                });
            } else {
                defer.reject();
            }
            
            return defer.promise;
        };

        this.query = function() {
            var defer = $q.defer();

            $http({
                method : 'GET',
                url : '/users'
            }).success(function(resp){
                defer.resolve(resp.users);
            }).error(function (msg) {
                defer.reject(msg);
            });

            return defer.promise;
        };
    });



    app.controller('MainCtrl', ['$scope', 'UserService', function($scope, UserService) {
        var self = this;

        var getUsers = function () {
            UserService.query().then(function (users) {
                $scope.selectedUser = _.findWhere(users, { selected: true }) || { name : 'No user selected' };
                $scope.users = users;
            }, function (message) {
                $scope.message = message;
            });
        };

        getUsers();

        $scope.$on('file:new', function () {
            if ($scope.selectedUser) {
                self.updateUser($scope.selectedUser);
            }
        });

        $scope.$on('file:first', getUsers);
        $scope.$on('file:remove', getUsers);

        self.updateUser = function(user) {
            UserService.update(user).then(function (message) {
                $scope.message = message;
            });
        };
    }]);

}(window.angular));