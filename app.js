
(function() {
'use strict';

  // System Code
  var http = require('http');

  var async = require('async');

  var drone = require('ar-drone');
  var Parser = require('./node_modules/ar-drone/lib/video/PaVEParser.js');
  var parser = new Parser();

  var client = drone.createClient();
  var tcpVideoStream = client.getVideoStream();
  // var output = require('fs').createWriteStream('./vid.mp4');
  client.config('video:video_channel', 0);

var fpvObject;

console.log(client);

  // tcpVideoStream.on('data', console.log);

  // tcpVideoStream.connect(function() {
  //   console.log('connected.');

    tcpVideoStream.on('error', function (err) {
      console.log(err.message);
      tcpVideoStream.end();
      tcpVideoStream.emit("end");
      // init();
    });
    // //
    // // parser = new Parser();
    tcpVideoStream.on('data', function (data) {
      // console.log(data);
      // parser.write(data);
    });
  // });

  // var server = http.createServer(function(req, res) {});
  // require("dronestream").listen(server);
  // server.listen(5555);

  /* requestAnimationFrame polyfill: */
(function (window) {
    'use strict';
    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        x,
        length,
        currTime,
        timeToCall;

    for (x = 0, length = vendors.length; x < length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[
            vendors[x] + 'RequestAnimationFrame'
        ];
        window.cancelAnimationFrame = window[
            vendors[x] + 'CancelAnimationFrame'
        ] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            lastTime = currTime + timeToCall;
            return window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}(window));

  /* NodeCopterStream: */
  (function (window, document, undefined) {
      'use strict';
      var NS,
          socket,
          avc,
          webGLCanvas,
          width,
          height,
          callbackOnce = null;

      function setupAvc() {
          avc = new Avc();
          avc.configure({
              filter: 'original',
              filterHorLuma: 'optimized',
              filterVerLumaEdge: 'optimized',
              getBoundaryStrengthsA: 'optimized'
          });
          avc.onPictureDecoded = handleDecodedFrame;
      }

      function handleNalUnits(message) {
                    // console.log(message);
          avc.decode(new Uint8Array(message));
      }

      function handleDecodedFrame(buffer, bufWidth, bufHeight) {
          var callback;

          requestAnimationFrame(function () {
              var lumaSize = bufWidth * bufHeight,
                  chromaSize = lumaSize >> 2;

              webGLCanvas.YTexture.fill(buffer.subarray(0, lumaSize));
              webGLCanvas.UTexture.fill(buffer.subarray(lumaSize, lumaSize + chromaSize));
              webGLCanvas.VTexture.fill(buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize));
              webGLCanvas.drawScene();
          });

          // call callback with Y portion (grayscale image)
          if (null !== callbackOnce && width) {
              callback = callbackOnce;
              callbackOnce = null;
              // decoded buffer size may be larger,
              // so use subarray with actual dimensions
              callback(buffer.subarray(0, width * height));
          }
      }

      function setupCanvas(div) {
          var canvas = document.createElement('canvas');

          width = div.attributes.width ? div.attributes.width.value : 640;
          height = div.attributes.height ? div.attributes.height.value : 360;

          canvas.width = width;
          canvas.height = height;
          canvas.style.backgroundColor = "#333333";
          div.appendChild(canvas);

          webGLCanvas = new YUVWebGLCanvas(canvas, new Size(width, height));
      }


      NS = function (div, options) {
          var hostname, port;
          options = options || {};
          hostname = options.hostname || window.document.location.hostname;
          port = options.port || window.document.location.port;

          setupCanvas(div);
          setupAvc();

          console.log(div, options);

          // socket = new WebSocket(
          //      'ws://' + hostname + ':' + port + '/dronestream'
          // );
          // socket.binaryType = 'arraybuffer';
          // socket.onmessage = handleNalUnits;

          // console.log('connecting to drone...');
          //
          // tcpVideoStream.connect(function() {
          //   console.log('connected.');
          //
          //   tcpVideoStream.on('error', function (err) {
          //     console.log(err.message);
          //     tcpVideoStream.end();
          //     tcpVideoStream.emit("end");
          //     // init();
          //   });
          //   // //
          parser = new Parser();
            tcpVideoStream.on('data', function (data) {
              parser.write(data);
            });
          // });

          // //
          parser.on('data', function (data) {
            handleNalUnits(data.payload);
          });
          //
          parser.on('end', function(data) {
            output.end();
          });

          // tcpVideoStream.pipe(parser);
      };

      // enqueue callback oto be called with next (black&white) frame
      NS.prototype.onNextFrame = function (callback) {
          callbackOnce = callback;
      };

      window.FPVStream = NS;

  }(window, document, undefined));

// UX code
  angular
    .module('ForgeMod', [
      'ngRoute',
      'ngResource',
      'ui.router',
      'ngAnimate',
      'ui.bootstrap',
      'ui.utils',
      'ngDragDrop',
      'ngWebSocket',
      'ng.epoch',
      'ui.ace'
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('fly', {
          url:            '/',
          templateUrl:    'views/fly.html',
          controller:     'FlightCtrl'
        })
        .state('mission', {
          url:            '/',
          templateUrl:    'views/mission.html',
          controller:     'MissionCtrl'
        })
        .state('code', {
          url:            '/',
          templateUrl:    'views/code.html',
          controller:     'CodeCtrl'
        })
        .state('forge', {
          url:            '/',
          templateUrl:    'views/forge.html',
          controller:     'ForgeCtrl'
        })
      ;
    })
    .factory('FlightSaver', function() {
      var firstEvent = false;
      var activeFd = null;
      var startDate = null;
      var bufferedData = '';



      return {
        startSave: function() {

          // stop current file write.
          if (activeFd) {
            activeFd.end('],\n"end": "' + new Date() + '",\n}\n');
          }

          startDate = new Date();
          activeFd = require('fs').createWriteStream('flights/flight_'+startDate+'.json');

            // If the OS can't keep up with our write requests, we need to buffer
            // and wait.
            activeFd.on('drain', function() {
              activeFd.write(bufferedData);
            });

            activeFd.on('finish', function() {
              activeFd = null;
              startDate = null;
              bufferedData = '';
              firstEvent = false;
            });

            // write initial json header
            activeFd.write('{\n"start": "'+startDate+'",\n"flight": [\n');

        },
        persist: function(data, kind) {
          if (!activeFd) {
            return;
          }

          var addComma = '';

          if (firstEvent) {
            addComma += ',';
          } else {
            firstEvent = !firstEvent;
          }

          var json = addComma+JSON.stringify({
            event: kind,
            at: new Date(),
            data: data
          });

          if (!activeFd.write(json)) {
            bufferedData += json;
          }
        },
        endSave: function() {
          if (!activeFd) {
            return;
          }

          activeFd.end('],\n"end": "' + new Date() + '"\n}\n');
        }
      }
    })
    .factory('VideoPlayer', function() {
      var outputStream = null;
      var parser = new Parser();
      parser
        .on('data', function(data) {
          if (outputStream) {
            outputStream.write(data.payload);
          }
        })
        .on('end', function() {
          if (outputStream) {
            outputStream.end();
            outputStream = null;
          }
        });
      return {
        start: function(fname) {
          var video = client.getVideoStream();
          if (!video) {
            console.log("ERROR ON VIDEO SAVER");
            return;
          }

          if (outputStream) {
            outputStream.end();
          }

          outputStream = require('fs').createWriteStream('videos/'+fname+'.h264');
          video.pipe(parser);
        },
        end: function() {
          outputStream.end();
          outputStream = null;
        },
        getFileStream: function() {
          return outputStream;
        }
      }
    })
    // Want this to be a service so the mission data can be preserved.
    .factory('MissionPlayer', function($timeout, FlightSaver, VideoPlayer) {
      var missionData = [];
      var EMT_TAKEOFFDEFAULT = 10000;
      var isInMission = false;

      var compiledMission = {
        emt: NaN,
        ok: false,
        currentMission: NaN,
        error: null,
        statusText: null
      };

      function move(array, old_index, new_index) {
        if (new_index >= array.length || new_index < 0) {
          return array;
        } else {
          return array.splice(new_index, 0, array.splice(old_index, 1)[0]);
        }
      }

      return {
        addMission: function(mission) {
          missionData.push(angular.copy(mission));
        },
        removeMission: function(index) {
          missionData.splice(index, 1);
        },
        moveMissionUp: function(index) {
          if (index < missionData.length) {
            move(missionData, index, index+1);
          }
        },
        moveMissionDown: function(index) {
          if (index >= 0) {
            move(missionData, index, index-1);
          }
        },
        getMission: function() {
          return missionData;
        },
        getMissionStatus: function() {
          return compiledMission;
        },
        // Does not actually run the mission, just checks for errors.
        compileMission: function() {
          compiledMission.emt = EMT_TAKEOFFDEFAULT;
          compiledMission.ok = false;

          compiledMission.progress = [
            {
              type: 'success',
              value: 0
            },
            {
              type: 'danger',
              value: 0
            },
            {
              type: 'info',
              value: 0
            },
            {
              type: 'warning',
              value: 0
            }
          ];

          angular.forEach(missionData, function(data) {
            switch (data.kind) {
              case 'primary':
                if (data.duration < 100 || data.duration > 100000) {
                  compiledMission.error = "Out of Range: " + data.duration;
                  return;
                } else if (!data.commandSelect) {
                  compiledMission.error = "Undefined Command";
                  return;
                } else {
                  compiledMission.emt += data.duration;
                  compiledMission.progress[0].value += data.duration;
                }
                break;
              case 'move':
                if (data.duration < 100 || data.duration > 100000) {
                  compiledMission.error = "Out of Range: " + data.duration;
                  return;
                } else if (!data.commandSelect) {
                  compiledMission.error = "Undefined Command";
                  return;
                } else if (data.amount < 0 || data.amount > 1) {
                  compiledMission.error = "Out of Range: " + data.amount;
                  return;
                } else {
                  compiledMission.emt += data.duration;
                  compiledMission.progress[1].value += data.duration;
                }
                break;
              case 'maneuver':
                if (data.duration < 100 || data.duration > 100000) {
                  compiledMission.error = "Out of Range: " + data.duration;
                  return;
                } else if (!data.commandSelect) {
                  compiledMission.error = "Undefined Command";
                  return;
                } else {
                  compiledMission.emt += data.duration;
                  compiledMission.progress[2].value += data.duration;
                }
                break;
              case 'leds':
                if (data.duration < 1 || data.duration > 100) {
                  compiledMission.error = "Out of Range: " + data.seconds;
                  return;
                } else if (!data.commandSelect) {
                  compiledMission.error = "Undefined Command";
                  return;
                } else if (data.freq < 0 || data.freq > 60) {
                  compiledMission.error = "Out of Range: " + data.freq;
                  return;
                } else {
                  compiledMission.emt += 100;
                  compiledMission.progress[3].value += 100;
                }
                break;
              default:
                compiledMission.error = "Unknown type: " + data.kind;
                return;
            }
          });

          // calculate progressbar
          compiledMission.progress[0].value += 10000;
          angular.forEach(compiledMission.progress, function(bar) {
            bar.percent = Math.round((bar.value / compiledMission.emt) * 100);
          });

          compiledMission.ok = true;
        },
        runMission: function() {
          if (!compiledMission.ok) {
            compileMission.error = "Mission not compiled properly!";
            return;
          }

          compiledMission.currentMission = -1;

          var missionIter = angular.copy(missionData);
          var iter = missionIter[0];

          compiledMission.statusText = "Initial take off.";
          VideoPlayer.start('video_'+new Date());
          client.takeoff();

          client.on('navdata', function(data) {
            if (isInMission) {
              FlightSaver.persist(data, 'telemetry');
            }
          });

          function processCmd() {
            client.stop();

            if (!compiledMission.ok) {
              compiledMission.statusText = "Mission aborted. Landing.";
              client.land();
              FlightSaver.persist({
                kind: 'primary',
                commandSelect: 'land'
              },'command');
              FlightSaver.endSave();
              isInMission = false;
              console.log("********************** ABORT **************************");
              return;
            }

            if (missionIter.length <= 0) {
              compiledMission.statusText = "Mission completed. Landing.";
              compiledMission.currentMission++;
              client.land();
              FlightSaver.persist({
                kind: 'primary',
                commandSelect: 'land'
              },'command');
              FlightSaver.endSave();
              isInMission = false;
              console.log("************************ END *************************");
              return;
            }

            console.log("************* MISSSION SWITCH *************");

            iter = missionIter.shift();
            compiledMission.currentMission++;
            FlightSaver.persist(iter, 'command');
            switch (iter.kind) {
              case 'primary':
                if (iter.commandSelect == 'payload') {
                  if (VideoPlayer.getFileStream()) {
                    VideoPlayer.end();
                  } else {
                    VideoPlayer.start('video_'+new Date());
                  }
                } else {
                  client[iter.commandSelect]();
                }

                $timeout(processCmd, iter.duration);
                compiledMission.emt-=iter.duration;
                compiledMission.statusText = "Primary command " + iter.commandSelect + " for " + iter.duration + "ms.";
                break;
              case 'move':
                client[iter.commandSelect](iter.amount);
                $timeout(processCmd, iter.duration);
                compiledMission.emt-=iter.duration;
                compiledMission.statusText = "Moving " + iter.commandSelect + " at " + iter.amount +  " for " + iter.duration + "ms.";
                break;
              case 'maneuver':
                client.animate(iter.commandSelect, iter.duration);
                $timeout(processCmd, iter.duration);
                compiledMission.emt-=iter.duration;
                compiledMission.statusText = "Performing maneuver " + iter.commandSelect + " for " + iter.duration + "ms.";
                break;
              case 'leds':
                client.animateLeds(iter.commandSelect, iter.freq, iter.seconds);
                $timeout(processCmd, 100);
                compiledMission.emt-=100;
                compiledMission.statusText = "Setting Glow " + iter.commandSelect + " at " + iter.freq +  "hz for " + iter.seconds + "seconds.";
                break;
            }
          }

          // Get the ball rolling.
          console.log("******************************************************");
          isInMission = true;
          FlightSaver.startSave();
          FlightSaver.persist({
            kind: 'primary',
            duration: 10000,
            commandSelect: 'takeoff'
          },'command');
          compiledMission.emt-=EMT_TAKEOFFDEFAULT;
          $timeout(processCmd, EMT_TAKEOFFDEFAULT);

        },
        endMission: function() {
          compiledMission.ok = false;
        },
        inMission: function() {
          return isInMission;
        }
      };
    })
    .controller('AppCtrl', function($scope, $log, $state, $modal, $interval, $rootScope) {
      $scope.status = null;
      $scope.currentIp = "192.168.1.1";
      $scope.telemetry = {};
      $scope.isConnected = false;
      $scope.DroneStatus = "Not connected";
      $state.go('fly');
      $scope.currentState = 'fly';
      $scope.alerts= [ ];
      var prevHeader =  0;

      $rootScope.leds = ['blinkGreenRed', 'blinkGreen', 'blinkRed', 'blinkOrange', 'snakeGreenRed',
        'fire', 'standard', 'red', 'green', 'redSnake', 'blank', 'rightMissile',
        'leftMissile', 'doubleMissile', 'frontLeftGreenOthersRed',
        'frontRightGreenOthersRed', 'rearRightGreenOthersRed',
        'rearLeftGreenOthersRed', 'leftGreenRightRed', 'leftRedRightGreen',
        'blinkStandard'];

      $rootScope.flightPerfs = ['phiM30Deg', 'phi30Deg', 'thetaM30Deg', 'theta30Deg', 'theta20degYaw200deg',
        'theta20degYawM200deg', 'turnaround', 'turnaroundGodown', 'yawShake',
        'yawDance', 'phiDance', 'thetaDance', 'vzDance', 'wave', 'phiThetaMixed',
        'doublePhiThetaMixed', 'flipAhead', 'flipBehind', 'flipLeft', 'flipRight'];


      client.on('navdata', function(data) {
        $scope.telemetry = data;
        prevHeader = data.header;
        $scope.isConnected = true;
        $scope.DroneStatus = "Connected on " + $scope.currentIp;
      });

      $interval(function () {
        if ($scope.telemetry.header == prevHeader) {
          $scope.isConnected = false;
        }
      }, 5000);

      $scope.addAlert = function(type, msg) {
        $scope.alerts.push({type: type, msg: msg});
      };

      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };

      $scope.changeState = function(name) {
        $state.go(name);
        $scope.currentState = name;
      };

      $scope.Parrot = function() {

        var modalInstance = $modal.open({
          animation: $scope.animationsEnabled,
          templateUrl: 'widgets/connectModal.html',
          controller: 'ConnectCtrl'
        });

        modalInstance.result.then(function (selectedItem) {
          client = drone.createClient({ip: selectedItem});

          if (!client) {
            $scope.addAlert('danger', 'Could not connect to a parrot');
            $scope.DroneStatus = 'Not connected';
            $scope.isConnected = false;
          } else {
            connection.reconnect();
            $scope.currentIp = selectedItem;
            $scope.DroneStatus = 'Attempting connection on ' + selectedItem + '...';
          }
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });
      };

    })
    .controller('FlightCtrl', function($scope, $timeout, $rootScope, MissionPlayer, FlightSaver) {
      $scope.telemetry = {};
      $scope.isFlying = false;
      $scope.inMotion = false;
      $scope.currentMove = 0.2;
      $scope.currentRot = 0.2;

      $scope.leds = $rootScope.leds;
      $scope.flightPerfs = $rootScope.flightPerfs;

      $scope.selectedLed = $scope.leds[0];
      $scope.flightPerf = 'wave';
      $scope.graphSelect = 'altitude';

      /*
       * Class for generating real-time data for the area, line, and bar plots.
       */
       function generateLineData () {
         var data1 = [{label: 'Layer 1', values: []}];
         for (var i = 0; i <= 128; i++) {
             var x = 20 * (i / 128) - 10,
                 y = Math.cos(x) * x;
             data1[0].values.push({x: x, y: y});
         }
         var data2 = [
             {label: 'Layer 1', values: []},
             {label: 'Layer 2', values: []},
             {label: 'Layer 3', values: []}
         ];
         for (var i = 0; i < 256; i++) {
             var x = 40 * (i / 256) - 20;
             data2[0].values.push({ x: x, y: Math.sin(x) * (x / 4) });
             data2[1].values.push({ x: x, y: Math.cos(x) * (x / Math.PI) });
             data2[2].values.push({ x: x, y: Math.sin(x) * (x / 2) });
         }
         return data2;
       }
      var RealTimeData = function(layers) {
          this.layers = layers;
          this.timestamp = ((new Date()).getTime() / 1000)|0;
      };

      RealTimeData.prototype.rand = function() {
          return parseInt(Math.random() * 100) + 50;
      };

      RealTimeData.prototype.history = function(entries, data) {
          if (typeof(entries) != 'number' || !entries) {
              entries = 60;
          }

          var history = [];
          for (var k = 0; k < this.layers; k++) {
              history.push({ values: [] });
          }

          for (var i = 0; i < entries; i++) {
              for (var j = 0; j < this.layers; j++) {
                  history[j].values.push({time: this.timestamp, y: data || 0});
              }
              this.timestamp++;
          }

          return history;
      };

      RealTimeData.prototype.next = function(data) {
          var entry = [];
          for (var i = 0; i < this.layers; i++) {
              entry.push({ time: this.timestamp, y: data || 0 });
          }
          this.timestamp++;
          return entry;
      }

      window.RealTimeData = RealTimeData;

      var liveLineData = new RealTimeData(2);

      $scope.realtimeArea = [{ label: 'Layer 1', values: [] }];
      $scope.realtimeAreaFeed = null;
      $scope.areaAxes = ['left','right','bottom'];

      $scope.lineData = generateLineData();
      $scope.lineAxes = ['right','bottom'];

      var chartEntry = [];


      // Realtime Line
      $scope.realtimeLine = liveLineData.history(0);
      // console.log($scope.realtimeLine);
      $scope.realtimeLineFeed = liveLineData.next(0);


      // optical drift canvas render.
      // Still trying to do research about useable libraries here.
      // Processingjs doesn't seem to work, so we may need to hack it.
      // I personally think Processingjs should be apart of the app.
      var view = document.getElementById('opticalDrift');
      var ctx = view.getContext('2d');
      $scope.driftX = 200; $scope.driftY = 200;
      ctx.fillStyle = "#CCCCCC";
      ctx.fillRect(0,0,400,400);
      ctx.lineWidth = 2;
      ctx.moveTo($scope.driftX, $scope.driftY);

      client.on('navdata', function(data) {
        $scope.telemetry = data;
        if (data && data.demo && data.droneState.flying) {
          $scope.driftX = 200 + Math.ceil(data.demo.drone.camera.translation.x / 10);
          $scope.driftY = 200 + Math.ceil(data.demo.drone.camera.translation.y / 10);
          if ($scope.driftX < 400 || $scope.driftX > 0 || $scope.driftY < 400 || $scope.driftY > 0) {
            ctx.lineTo($scope.driftX,$scope.driftY);
          }
          ctx.stroke();
          switch ($scope.graphSelect) {
            case 'drift':  $scope.realtimeLineFeed = liveLineData.next(
              Math.sqrt(
                  data.demo.drone.camera.translation.x*data.demo.drone.camera.translation.x
                  + data.demo.drone.camera.translation.y*data.demo.drone.camera.translation.y
                  + data.demo.drone.camera.translation.z*data.demo.drone.camera.translation.z
                ));
                 break;
            case 'altitude': $scope.realtimeLineFeed = liveLineData.next(data.demo.altitude); break;
            case 'yaw': $scope.realtimeLineFeed = liveLineData.next(data.demo.yaw); break;
            case 'pitch': $scope.realtimeLineFeed = liveLineData.next(data.demo.pitch); break;
            case 'roll': $scope.realtimeLineFeed = liveLineData.next(data.demo.roll); break;
            case 'xVelocity': $scope.realtimeLineFeed = liveLineData.next(data.demo.xVelocity); break;
            case 'yVelocity': $scope.realtimeLineFeed = liveLineData.next(data.demo.yVelocity); break;
            case 'zVelocity': $scope.realtimeLineFeed = liveLineData.next(data.demo.zVelocity); break;
          }
        }

        // if (MissionPlayer.inMission()) {
        //
        // }
      });


      $scope.Clear = function() {
        client.disableEmergency();
      }


      $scope.MoveUp = function(amt) {
        client.up(amt);
        if ($scope.telemetry.droneState.flying) {
          $scope.inMotion = true;
          $timeout(function() {
            $scope.Stop();
          }, 1000);
        }
      }
      $scope.MoveDown = function(amt) {
        client.down(amt);
        if ($scope.telemetry.droneState.flying) {
          $scope.inMotion = true;
          $timeout(function() {
            $scope.Stop();
          }, 1000);
        }
      }
      $scope.MoveLeft = function(amt) {
        client.left(amt);
        if ($scope.telemetry.droneState.flying) {
          $scope.inMotion = true;
          $timeout(function() {
            $scope.Stop();
          }, 1000);
        }
      }
      $scope.MoveRight = function(amt) {
        client.right(amt);
        if ($scope.telemetry.droneState.flying) {
          $scope.inMotion = true;
          $timeout(function() {
            $scope.Stop();
          }, 1000);
        }
      }

      $scope.Clockwise = function(amt) {
        client.clockwise(amt);
      }

      $scope.CounterClockwise = function(amt) {
        client.counterClockwise(amt);
      }

      $scope.Stop = function() {
        client.stop();
        $scope.inMotion = false;
      }

      $scope.Fly = function(fly) {
        if ($scope.telemetry.droneState.flying) {
          client.land();
        } else {
          client.takeoff();
        }

        $scope.isFlying = !$scope.isFlying;
      };

      $scope.LedAnimation = function(anim, speed, time) {
        client.animateLeds(anim, speed, time);
      }

      $scope.Maneuver = function(maneuver, dur) {
        client.animate(maneuver, dur);
      }

    })
    .controller('CodeCtrl', function($scope, $timeout) {
      $scope.world = "";

        // TODO this needs to be reafactored.
        // For now, just got the terminal in order.

        $scope.languages = [
          {'name': 'Javascript',
           'sampleCode':
                  "client.takeoff();\n" +
                  "client.after(5000, function() { \n" +
                  "  this.stop();\n" +
                  "  this.land();\n" +
                  "});"
          }
        ];

        $scope.language = $scope.languages[0];
        var editor = null;
        var con = null;

        $scope.editorOptions = {
          animatedScroll: true,
          showPrintMargin: false,
          mode: $scope.language.name.toLowerCase(),
          onLoad: function (_editor) {
            editor = _editor;
            // var _session = _editor.getSession();
            // var _renderer = _editor.renderer;

            // _editor.setUndoManager(new ace.UndoManager());
            // _eidtor.getUndoManager().reset();

            // _editor.setShowPrintMargin(false);

            // $scope.languageChanged = function() {
            //   console.log(_session);
            //   if($scope.language.name === 'C/C++'){
            //     _session.setMode("ace/mode/" + 'c_cpp');
            //   }
            //   else{
            //     _session.setMode("ace/mode/" + $scope.language.name.toLowerCase());
            //   }
            // };
          }
        };

        $scope.consoleOptions = {
          animatedScroll: true,
          showPrintMargin: false,
          showLineNumbers: false,
          readonly: true,
          onLoad: function (_editor) {
            con = _editor;
          }
        };


        // HACK! Need to fix this
        var oldLog = console.log;
        console.log = function (message) {
          $scope.world += message + '\n';
          oldLog.apply(console, arguments);
        };


        // undo button
        $scope.undoBtn = function() {
          editor.undo();
        };

        $scope.redoBtn = function() {
          editor.redo();
        }

        // run and reset button
        $scope.run = function(){
          if($scope.language.name === 'C/C++') {
            $scope.world = [];
            $scope.world.push("[ERROR] C/C++ currently not supported by forge.\r\n");
            return;
          }
          if( $('div.ace_error').is(':visible') ){
            $scope.dynamic = 100;
            $scope.type = 'danger';
            $scope.message = 'Compiler Error :('
            $timeout(function(){$scope.world = 'Syntax error'}, 600);
          }
          else{
            $scope.dynamic = 100;
            $scope.message = 'Compiled Successfully :)';
            $scope.type = 'success';
            $scope.world = [];

            // HACK
            // quick and dirty.
            try {
              (new Function ('client',editor.getSession().getValue()))(client);
              console.log(editor.getSession().getValue());
            } catch(e) {
              $scope.world = '';
              $scope.world += "[Error] " + e;
              $scope.dynamic = 100;
              $scope.type = 'danger';
              $scope.message = 'Compiler Error :(';
            }

          }
        };

        $scope.land = function() {
          client.land();
        }

        $scope.reset = function(){
          $scope.dynamic = 0;
          $scope.type = null;
          $scope.world = '';
          $scope.message = '';
        };

    })
    .controller('MissionCtrl', function($scope, MissionPlayer) {

      $scope.missionPlayList = MissionPlayer.getMission();
      $scope.missionStatus = MissionPlayer.getMissionStatus();

      $scope.removeNode = function(index) {
        MissionPlayer.removeMission(index);
        MissionPlayer.compileMission();
      };

      $scope.NodeDown = function(index) {
        MissionPlayer.moveMissionDown(index);
      };

      $scope.NodeUp = function(index) {
        MissionPlayer.moveMissionUp(index);
      };

      $scope.runMission = function() {
        // Some initial stuff
        client.stop();
        client.land();
        client.disableEmergency();
        MissionPlayer.compileMission();
        MissionPlayer.runMission();
      }

      $scope.abortMission = function() {
        MissionPlayer.endMission();
        client.stop();
        client.land();
      }

      // Set up drag/drop logic
      // TODO - delete blocks
      // TODO - rearrange blocks
      // dragula([document.getElementById('missionQueue'),
      //   document.getElementById('missionBlocks')], {
      //   copy: true,
      //   removeOnSpill: true,
      //   accepts: function(el, target, source, sib) {
      //     if ((document.getElementById('missionBlocks') == source)
      //     && (document.getElementById('missionQueue') == target)) {
      //       return true;
      //     } else {
      //       return false;
      //     }
      //   }
      // })
      //   .on('drop', function(el) {
      //     if (el.parentElement.id == 'missionQueue') {
      //       // Note that newEl is by reference. If you try to deep copy this,
      //       // you'll get a type invocation error.
      //       // var newEl = $compile( el )( $scope );
      //       // $('missionQueue').append(newEl);
      //       // $scope.$broadcast('updateFormat', newEl);
      //
      //       // $('missionQueue').remove(el);
      //     }
      //   });

    })
    .controller('ForgeCtrl', function($scope) {

      var fs = require('fs');

      $scope.serializeFlights = function() {

      };

      $scope.sync = function() {
        function syncFile(file, done) {

          function processFile(data, done) {
              var json;
              try {
                json = JSON.stringify(data);
                if (!json.hasOwnProperty('_id')) {
                  console.log('TODO [POST] /api/flight/');
                }
              } catch(e) {
                done(e, null);
              }
          }

          async.waterfall([
            function(callback) {
              fs.readFile('flights/' + file, callback);
            },
            processFile
          ], function(error, result) {
            if (error) {
              done(error);
            } else {
              console.log('file processed');
              done();
            }
          });
        }

        var files = fs.readdirSync('flights');

        async.each(files, syncFile, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log('success!');
          }
        })
      };

      // test the sync
      $scope.sync();

    })
    .controller('ConnectCtrl', function($scope, $modalInstance) {
      $scope.ok = function (form) {
        $modalInstance.close($scope.ipAddress);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    })
    .controller('MissionBlockCtrl', function($scope, $attrs, $element, $rootScope, MissionPlayer) {

      // $scope.duration = 1000;
      // $scope.cmd = null;

      var nodeInfo = null;

      // $scope.inUse = false;

      // $scope.$on('updateFormat', function(ev) {
      //   if ($element[0].parentElement.id == 'missionQueue') {
      //     $scope.inUse = true;
      //     $scope.$apply(function() {
      //       // $scope.$digest();
      //     });
      //   }
      // });

      $scope.leds = $rootScope.leds;
      $scope.flightPerfs = $rootScope.flightPerfs;

      $scope.type = $attrs.type;

      switch ($attrs.type) {
        default:
        case 'Primary':
          $scope.blockType = 'panel-success';
          $scope.blockName = 'Control Node';
          nodeInfo = {
            kind: 'primary',
            duration: 2000,
            commandSelect: 'stop'
          };
          break;
        case 'Move':
          $scope.blockType = 'panel-danger';
          $scope.blockName = 'Movement Node';
          nodeInfo = {
            kind: 'move',
            duration: 2000,
            commandSelect: 'up',
            amount: 0.2
          };
          break;
        case 'Maneuver':
          $scope.blockType = 'panel-info';
          $scope.blockName = 'Flight Maneuver Node';
          nodeInfo = {
            kind: 'maneuver',
            duration: 4000,
            commandSelect: 'wave',
          };
          break;
        case 'LEDs':
          $scope.blockType = 'panel-warning';
          $scope.blockName = 'Glow Node';
          nodeInfo = {
            kind: 'leds',
            seconds: 2,
            commandSelect: 'fire',
            freq: 5
          };
          break;
      }

      $scope.appendNode = function() {
        MissionPlayer.addMission(nodeInfo);
        MissionPlayer.compileMission();
      };

    })
    .directive('mission', function() {
      return {
        restrict: 'E',
        templateUrl: 'widgets/missionBlock.html',
        scope: {
          title: '=type'
        },
        controller: 'MissionBlockCtrl'
      }
    })
    .directive('navbar', function() {
      return {
          restrict: 'E',
          templateUrl: 'widgets/navbar.html'
      };
    })
  ;

})(window.App);
