var Discord = require('discord.js');
var Bot = new Discord.Client();
var Helper = require('./components/helper.js');
var Queue = require('./components/queue.js');
var TrackHelper = require('./components/trackhelper.js');
var WordService = require('./components/wordservice.js');
var WeatherService = require('./components/weatherservice.js');

var commands = {
  '!play': {
    execute: getVideo,
    description: 'phát video trên youtube'
  },
  '!weather': {
    execute: getWeather,
    description: 'lấy thời tiết của thành phố cần tìm, mặc định là Hà Nội'
  },
  '!roll': {
    execute: roll,
    description: 'roll từ 1-100'
  },
  '!help': {
    execute: showHelp
  },
  '!queue': {
    execute: doQueue,
    description: 'thêm bài hát của bạn vào hàng đợi'
  },
  '!voteskip': {
    execute: voteSkip,
    description: 'vote bỏ qua bài hát hiện tại'
  },
  '!getsong': {
    execute: showSong,
    description: 'lấy tên bài hát hiện tại'
  }
};

Bot.on('message', message => {
  if (isBotCommand(message)) {
    if(message == '!sakuri')
      message.reply('The World\'s Most Handsome And Powerful Man');
    else
      execute(message.content, message);
  }
});

function showSong(args, message) {
  Queue.showSong(message);
}

function voteSkip(args, message) {
  Queue.voteSkip(message);
}

function doQueue(args, message) {
  if (args.length <= 0) {
    return message.reply(Helper.wrap('Loại nhạc cần được chỉ định.'));
  }

  if (Queue.isFull()) {
    return message.reply(Helper.wrap('Hàng đợi đã đầy.'));
  }

  if (args.startsWith('http')) {
    TrackHelper.getVideoFromUrl(args).then(track => {
      Queue.add(track, message);
    }).catch(err => {
      message.reply(Helper.wrap(err));
    });
  } else {
    TrackHelper.getRandomTrack(args, 5).then(track => {
      Queue.add(track, message);
    }).catch(err => {
      message.reply(Helper.wrap(err));
    });
  }
}

function getVideo(args, message) {
  TrackHelper.getRandomTrack(args, 5).then(track => {
    message.reply(track.url);
  }).catch(err => {
    message.reply(Helper.wrap(err));
  });
}

function getWeather(args, message) {
  WeatherService.getWeather(args, message);
}

function showHelp(args, message) {
  var toReturn = 'Không có lệnh nào để thực hiện!';
  if (Object.keys(commands).length > 1) {
    var toReturn = 'Những lệnh hiện có:\n';
    for (var command in commands) {
      if (command != '!help') {
        data = commands[command];
        toReturn += command + ': ' + data.description + getAvailableCommandAsText(data) + '\n';
      }
    }
  }
  message.reply(Helper.wrap(toReturn));
}

function getAvailableCommandAsText(command) {
  if (!Helper.commandIsAvailable(command)) return ' (không có sẵn)';

  return '';
}

function roll(content, message) {
  message.reply(Helper.wrap('Kết quả roll của bạn là: ' + getRandomNumber(1, 100) + ' (1-100)'));
}

function isBotCommand(message) {
  if (message.content.startsWith('!') && message.author.id != Bot.user.id) {
    return true;
  }

  return false;
}

function execute(content, message) {
  var args = content.split(" ");
  var command = commands[args[0]];
  if (command) executeCommand(command, message, args);
}

function executeCommand(command, message, args) {
  if (!Helper.commandIsAvailable(command)) {
    return message.reply(Helper.wrap('Lệnh không có sẵn.'));
  }

  command.execute(getCommandArguments(args), message);
}

function getCommandArguments(args) {
  var withoutCommand = args.slice(1);

  return withoutCommand.join(" ");
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function registerService(service, affectedCommands) {
  service = new service();

  if (affectedCommands) {
    affectedCommands.forEach(command => {
      var c = commands[command];
      if (c) {
        if (!c.services) c.services = [];
        c.services.push(service);
      }
    });
  }

  return service;
}

function init() {
  Helper.keys('apikeys', ['discord']).then(keys => {
    Bot.login(keys.discord);

    Queue = registerService(Queue, ['!queue', '!voteskip', '!song']);
    TrackHelper = registerService(TrackHelper, ['!queue', '!video']);
    WeatherService = registerService(WeatherService, ['!weather']);
  }).catch(console.error);
}

init();
