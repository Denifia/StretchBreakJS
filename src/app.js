var UI = require('ui');
var Vector2 = require('vector2');
var Wakeup = require('wakeup');
var Vibe = require('ui/vibe');
var Clock = require('clock');
var alarmsStorageKey = "Alarms";
var localAlarms = null;

function Alarm (hour, minute) {
  this.hour = hour;
  this.minute = minute;
  this.alertId = 0;
}

function GetNextDay (day) {
  if (day === 6) {
    return 0;
  }
  return day + 1;
}

function SetAlarm (alarm, currentDay, tryAgain) {
  console.log('Setting alarm for ' + alarm.hour + ':' + alarm.minute + ' on ' + currentDay);
  var nextTime = Clock.weekday(currentDay, alarm.hour, alarm.minute);
  Wakeup.schedule(
    { time: nextTime },
    function(e) {
      if (e.failed) {
        if (tryAgain) {
          console.log('Didn\'t work, trying again the next day.');
          SetAlarm (alarm, GetNextDay(currentDay), false);
        } else {
          console.log('Didn\'t work twice. Give up!');
        }
      } else {
        console.log('Wakeup set! Event ID: ' + e.id);
        alarm.alertId = e.id;
      }
    }
  );
}

Pebble.addEventListener("ready", function() {
  localAlarms = localStorage.getItem(alarmsStorageKey);
  // If the alarms are not in local storage, create them
  if (localAlarms === null) {
    var alarms = [
      new Alarm(9, 10),
      new Alarm(11, 0),
      new Alarm(1, 30),
      new Alarm(3, 15),
      new Alarm(7, 30)
    ];
    localStorage.setItem(alarmsStorageKey, alarms);
    localAlarms = alarms;
  }
  
  var currentDay = 0;
  var isSmaller = true;
  var time1, time2 = null;
  while (isSmaller) {
    var nextDay = GetNextDay(currentDay);
    time1 = Clock.weekday(currentDay, 23, 59, 59);
    time2 = Clock.weekday(nextDay, 23, 59, 59);
    isSmaller = time1 < time2;
    console.log('Day ' + currentDay + ' is smaller than Day ' + nextDay + '? ' + isSmaller);
    currentDay = nextDay;
  }
  console.log('Figured out the day is currently ' + currentDay);
  for (var i = 0; i < localAlarms.length; i++) {
    // Schedule the alarms
    var alarm = localAlarms[i];
    SetAlarm(alarm, currentDay, true);
  }
});

var main = new UI.Card({
  body: 'You\'ll be alerted to start a stretch break from time to time. For now, enjoy your day.'
});

function ShowAlertCard() {
  var wind = new UI.Window({
    fullscreen: true,
  });
  var textfield = new UI.Text({
    position: new Vector2(0, 45),
    size: new Vector2(144, 55),
    font: 'gothic-24-bold',
    text: 'Good news!\nIt\'s time for a\nStretch Break!',
    textAlign: 'center'
  });
  wind.add(textfield);
  wind.show();
  Vibe.vibrate('short');
}

// Query whether we launched by a wakeup event
Wakeup.launch(function(e) {
  if (e.wakeup) {
    console.log('Woke up to ' + e.id + '! data: ' + JSON.stringify(e.data));
    ShowAlertCard();
  } else {
    console.log('Regular launch not by a wakeup event.');
    // Show the initial screen
    main.show();
  }
});

main.on('click', 'select', function(e) {
  ShowAlertCard();
});

