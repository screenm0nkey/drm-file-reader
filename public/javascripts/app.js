(function(angular){
    "use strict";

    var app = angular.module('app', ['ngResource']);

    app.directive('nlCloak', ['$rootScope', function ($rootScope) {
        return {
            restrict : 'A',
            controller : function ($element) {
                var registerArr = [];

                $rootScope.$on('nlcloak:add', function (evt, name) {
                    registerArr.push(name);
                });

                $rootScope.$on('nlcloak:remove', function (evt, name) {
                    registerArr = _.without(registerArr, name);

                    if (!registerArr.length) {
                        $element.removeAttr('nl-cloak');
                    }
                });
            }
        };
    }]);


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
                scope.$emit('nlcloak:add', 'fps:query');

                FilePathService.query().then(function (filePaths) {
                    scope.paths = filePaths;
                    scope.$emit('nlcloak:remove', 'fps:query');
                });

                scope.remove = function (item) {
                    FilePathService.remove(item.id).then(function (filePaths) {
                        scope.paths = filePaths;
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


    app.service('FilePathService', ['$rootScope', '$resource', '$q', function($rootScope, $resource, $q){
        var filePath = $resource('/filepath/:id', {id: '@id'}, {
            add: { method:'POST', isArray:true },
            remove: { method:'DELETE', isArray:true }
        });

        this.add = function(path) {
            var defer = $q.defer();

            filePath.add({path : path}, function (filePaths) {
                if (filePaths.length === 1) {
                    $rootScope.$broadcast('file:first');
                }
                $rootScope.$broadcast('file:new');
                defer.resolve(filePaths);
            },function (resp) {
                defer.reject(resp.data);
            });

            return defer.promise;
        };


        this.remove = function(id) {
            return filePath.remove({ id:id }, function () {
                $rootScope.$broadcast('file:remove');
            }).$promise;
        };

        this.query = function() {
            return filePath.query().$promise;
        };
    }]);


    app.service('UserService', function($q, $resource){
        var users = $resource('/users/:username', {username: '@username'}, {
            update: { method:'PUT' }
        });

        this.update = function(user){
            var defer = $q.defer();

            users.update(user, function (resp) {
                defer.resolve(resp);
            }, function () {
                defer.reject();
            });

            return defer.promise;
        };

        this.query = function() {
            var defer = $q.defer();

            users.query(function(users){
                defer.resolve(users);
            }, function(resp){
                defer.reject(resp.data[0]);
            });

            return defer.promise;
        };
    });



    app.controller('MainCtrl', ['$scope', 'UserService', function($scope, UserService) {
        $scope.$emit('nlcloak:add', 'mainctrl');

        var self = this;

        var getUsers = function () {
            UserService.query().then(function (users) {
                $scope.selectedUser = _.findWhere(users, { selected: true }) || { name : 'No user selected' };
                $scope.users = users;
                $scope.$emit('nlcloak:remove', 'mainctrl');
            }, function (message) {
                $scope.users = [];
                $scope.message = {type : 'error', message : message};
            });
        };

        getUsers();

        $scope.$on('file:new', function () {
            if ($scope.selectedUser) {
                self.updateUser($scope.selectedUser);
            }
        });

        // we only need to call getUsers when the first file is added as it will be used to update the users.
        $scope.$on('file:first', getUsers);
        $scope.$on('file:remove', getUsers);

        self.updateUser = function(user) {
            UserService.update(user).then(function (message) {
                $scope.message = message;
            });
        };
    }]);

}(window.angular));