(function(angular){
    "use strict";

    var req = 'Requester';
    var app = 'Approver';

    var userTypes = {
        DRM_Legal : req,
        DRM_TALM : app,
        DRM_Global_Treasury : app,
        DRM_MCOF : app,
        DRM_Collaborator : req,
        DRM_Sales : req
    }

    var app = angular.module('app', ['ngResource']);

    app.directive('nlCloak', ['$rootScope', '$window', function ($rootScope, $window) {
        return {
            restrict : 'A',
            controller : function ($element) {
                var registerArr = [];

                $rootScope.$on('loading', function (evt, name) {
                    registerArr.push(name);
                });

                $rootScope.$on('loaded', function (evt, name) {
                    if (registerArr.length) {
                        registerArr = _.without(registerArr, name);

                        // create a fake delay as everyone loves a spinner:)
                        $window.setTimeout(function () {
                            $element.hide().removeAttr('nl-cloak').fadeIn(200);
                            $rootScope.hideSpinner = true;
                            $rootScope.$apply();
                        }, 200);
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


    app.directive('nlAddFilePath', ['FilePathService', function (filePathService) {
        return {
            restrict : 'AE',
            replace : true,
            templateUrl : 'filepath.html',
            link : function (scope, element) {
                scope.$emit('loading', 'fpsquery');

                filePathService.query().then(function (filePaths) {
                    scope.paths = filePaths;
                    scope.$emit('loaded', 'fpsquery');
                });

                scope.remove = function (item) {
                    filePathService.remove(item.id).then(function (filePaths) {
                        scope.paths = filePaths;
                    });
                };

                scope.add = function (evt) {
                    var path = $(evt.target).closest('.path').find('input').val();
                    if (path) {
                        filePathService.add(path).then(function (files) {
                            scope.paths = files;
                            $(element).find('input').val('');

                        }, function (message) {
                            scope.message = message;
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
        var filePath = $resource('/filepaths/:id', {id: '@id'}, {
            add: { method:'POST' },
            remove: { method:'DELETE' },
            query: { method:'GET', isArray:false }
        });

        this.add = function(path) {
            var defer = $q.defer();

            filePath.add({path : path}, function (resp) {
                if (resp.files.length === 1) {
                    $rootScope.$broadcast('file:first');
                }
                $rootScope.$broadcast('file:new');
                defer.resolve(resp.files);
            },function (resp) {
                defer.reject(resp.data);
            });

            return defer.promise;
        };

        this.remove = function(id) {
            var defer = $q.defer();
            filePath.remove({ id:id }, function (resp) {
                if (!resp.files.length) {
                    $rootScope.$broadcast('file:nofiles');
                }

                $rootScope.$broadcast('file:remove');
                defer.resolve(resp.files);
            });
            return defer.promise;
        };

        this.query = function() {
            var defer = $q.defer();
            filePath.query(function (resp) {
                defer.resolve(resp.files);
            });
            return defer.promise;
        };
    }]);


    app.service('UserService', ['$q', '$resource', function($q, $resource){
        var users = $resource('/users/:username', {username: '@username'}, {
            update: { method:'PUT' },
            query: { method:'GET', isArray:false }
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

            users.query(function(resp){
                // add type i.e. requester, approver
                _.each(resp.users, function(user){
                    user.type = userTypes[user.group] || 'All Roles';

                });
                defer.resolve(resp.users);
            }, function(resp){
                defer.reject(resp.data);
            });

            return defer.promise;
        };
    }]);


    app.controller('MainCtrl', ['$scope', 'UserService', function($scope, userService) {
        var self = this;

        $scope.$emit('loading', 'mainctrl');

        var getUsers = function () {
            userService.query().then(function (users) {
                $scope.selectedUser = _.findWhere(users, { selected: true }) || { name : 'No user selected' };
                $scope.users = users;
                $scope.$emit('loaded', 'mainctrl');
            }, function (message) {
                $scope.users = [];
                $scope.message = message;
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
        $scope.$on('file:nofiles', getUsers);

        self.updateUser = function(user) {
            userService.update(user).then(function (message) {
                $scope.message = message;
            });
        };
    }]);

}(window.angular));