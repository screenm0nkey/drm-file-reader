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
                            scope.$emit('new:file');
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


    app.service('FilePathService', function($http, $q){
        var defer = $q.defer();

        this.add = function(path) {
            var defer = $q.defer();

            $http({
                method : 'POST',
                url : '/filepath',
                data : {path : path }
            }).success(function(resp){
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
        this.update = function(name){
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
            }).error(function (msg) {
                defer.reject(msg);
            });

            return defer.promise;
        };
    });



    app.controller('MainCtrl', ['$scope', 'UserService', function($scope, UserService) {
        var self = this;

        $scope.$on('new:file', function () {
            if ($scope.selectedUser) {
                self.updateUser($scope.selectedUser);
            }
        });
        
        UserService.query().then(function (users) {
            $scope.selectedUser = _.findWhere(users, {selected: true}) || { name : 'No user selected' };
            $scope.users = users;
        }, function (msg) {
            $scope.message = {
                type: 'error',
                message : msg
            };
        });

        self.updateUser = function(user) {
            UserService.update(user.username).then(function (resp) {
                $scope.message = {
                    message : 'Update files to use ' + resp.data.message
                };
            });
        };
    }]);

}(window.angular));