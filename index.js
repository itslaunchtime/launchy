const Discord = require('discord.js');
const client = new Discord.Client();
const token = process.env.DISCORD_BOT_SECRET;
const keep_alive = require('./alive.js');
const axios = require('axios');
const ytdl = require('ytdl-core');

const prefix = "launchy "; //replace with what you want the bot prefix to be and include a space if you want it between the prefix and command

var isPlaying = false;
var nowPlaying;
var vc;
var queueLength = 0;
var songQueue = [];
var conn;

class Song {
  constructor(url, msg) {
    this.url = url;
    this.info;
    this.title;
    this.length = 0;
    this.formattedTime;
    this.origin = msg;
    this.getSongInfo();
  }
  getSongInfo = async () => {
    this.info = await ytdl.getInfo(this.url);
    this.title = this.info.videoDetails.title;
    this.length = this.info.videoDetails.lengthSeconds;

    this.formattedTime = formatTime(this.length);
    

    //must have this here due to function being async, otherwise you get undefined for title
    const embed = new Discord.MessageEmbed();
    embed.setColor([212, 115, 210]);
    embed.setAuthor("Added to Queue", client.user.avatarURL());
    embed.setThumbnail(this.info.videoDetails.thumbnails[0].url);
    embed.setTitle(this.title);
    embed.setURL(this.url);
    embed.addField("Channel", `[${this.info.videoDetails.author.name}](${this.info.videoDetails.author.channel_url})`, true);
    embed.addField("Duration", this.formattedTime, true);
    if (isPlaying) {
      embed.addField("Est. Time Before Playing", formatTime(queueLength + (nowPlaying.length - Math.floor(conn.dispatcher.streamTime / 1000))));
      queueLength += parseInt(this.length);
    }
    if (!isPlaying) {
      embed.addField("Est. Time Before Playing", "Now");
      isPlaying = true;
      queueLength = 0;
    }
    embed.setFooter(`Requested by: ${this.origin.author.username} (${this.origin.author.tag})`, this.origin.author.avatarURL());
    this.origin.channel.send(embed);
  }
}

function formatTime(time) {
  var tSeconds = time % 60;
  var tMin = Math.floor(time / 60);
  //console.log(time + ", " + tSeconds + ", " + tMin + ", " + queueLength);
  if (tSeconds < 10) {
    return `${tMin}:0${tSeconds}`;
  }
  return `${tMin}:${tSeconds}`;
}

client.on('ready', () => {
  console.log('running /');
  /*async function getCommands(){
    let commands = await client.api.applications(client.user.id).commands.get();
    console.log(commands);
    let req = await client.api.applications(client.user.id).commands(`821812491859787777`).delete()
    return req;
  }
  getCommands();*/

  client.api.applications(client.user.id).commands.post({
    data: {
      name: "poll",
      description: "Start a poll!",
      options: [
        {
        name: "question",
        description: "what do you want to poll?",
        type: 3
        }
      ]
    }
  })

  client.api.applications(client.user.id).commands.post({
    data: {
      name: "status",
      description: "Next launch status",
    }
  })

  client.api.applications(client.user.id).commands.post({
    data: {
      name: "help",
      description: "Need some help?"
    }
  })

  client.api.applications(client.user.id).commands.post({
    data: {
      name: "link",
      description: "Share the link!"
    }
  })

  client.api.applications(client.user.id).commands.post({
    data: {
      name: "poll",
      description: "Start a poll!",
      options: [{
        name: "question",
        description: "what do you want to poll?",
        type: 3
      }]
    }
  })

  client.api.applications(client.user.id).commands.post({
    data: {
      name: "feature",
      description: "What features do you want to see?",
      options: [
        {
          name: "feature",
          description: "please list the feature you want.",
          type: 3
        }
      ]
    }
  })

  client.api.applications(client.user.id).commands.post({
    data: {
      name: "update",
      description: "Update the API",

      options: [
        {
          name: "event",
          description: "change the event name",
          type: 3
        },
        {
          name: "status",
          description: "change the status",
          type: 3
        },
        {
          name: "description",
          description: "change the status",
          type: 3
        },
        {
          name: "net",
          description: "change the NET time",
          type: 3
        },
        {
          name: "vehicle",
          description: "change the vehicle name",
          type: 3
        },
        {
          name: "stages",
          description: "change the vehicle stages",
          type: 3
        },
        {
          name: "sn",
          description: "change the booster serial number",
          type: 3
        },
        {
          name: "flightproven",
          description: "is the booster flight proven?",
          type: 3
        },
        {
          name: "previousflights",
          description: "how many flights does the booster have?",
          type: 3
        },
        {
          name: "other",
          description: "any other notes?",
          type: 3
        },
      ]
    }
  })

  client.ws.on('INTERACTION_CREATE', async interaction => {
    const command = interaction.data.name.toLowerCase();
    const args = interaction.data.options;

    if(command == "feature"){
      const dat = args.find(arg => arg.name.toLowerCase() == "feature").value;
      client.channels.cache.get('822179822095695873').send(`${dat}`);

      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            content: 'Added! The devs will review it, and add it soon.'
          }
        }
      })
    }

    if(command == "help"){
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            content: `help is on the way!`
          }
        }
      })

      const helpEmbed = new Discord.MessageEmbed()
        .setColor('#7289da')
        .setTitle("Here's what you can do:")
        .setAuthor('Launchy', 'https://github.com/itslaunchtime/resources/blob/main/launchy.png?raw=true', 'https://itslaunchti.me/launchy')
        .addFields(
          { name: '/status', value: 'Gets the status of the latest launch.', inline: true },
          { name: '/link', value: 'Sends the link to the site!', inline: true },
          { name: '/feature', value: "Let's the devs know you have something to say.", inline: true },
          { name: '\u200B', value: '\u200B' },
          { name: '/poll', value: 'Starts a poll and mentions the polls role.', inline: true },
          { name: '/update', value: '[CONTRIBUTORS ONLY] allows you to update the API.', inline: true },
          { name: '/help', value: 'Sends this embed!', inline: true },
        )
      
      function sendHelp(){
        client.channels.cache.get(interaction.channel_id).send(helpEmbed);
      }

      setTimeout(sendHelp, 1000);
    }

    if(command == "poll"){
      const dat = args.find(arg => arg.name.toLowerCase() == "question").value;

      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            content: '<@&822597312051544105>'
          }
        }
      })

      const pollEmbed = new Discord.MessageEmbed()
        .setTitle(`Poll from ${interaction.member.nick}!`)
        .setDescription(dat)
      
      function sendPoll(){
        client.channels.cache.get(interaction.channel_id).send(pollEmbed).then(embedMessage => {
          embedMessage.react("👍");
          embedMessage.react("👎");
        });
      }

      setTimeout(sendPoll, 1000);
    }

    if(command == "link"){
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            content: 'https://itslaunchti.me/'
          }
        }
      })
    }

    if(command == "link"){
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            content: 'https://itslaunchti.me/'
          }
        }
      })
    }

    if(command == "status"){
      async function getData() {
        const response = await axios.get(`https://api.itslaunchti.me/v1/data`)
        if(response.data.status !== ''){
          client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
              type: 4,
              data: {
                content: `${response.data.status}`
              }
            }
          })
        }
        else {
          client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
              type: 4,
              data: {
                content: 'Error! https://itslaunchti.me/'
              }
            }
          })
        }
      }
      getData();
    }

    if(command == "update"){
      if(interaction.member.roles.includes("821815991947362324")){
        var count = Object.keys(args).length;
        for (i = 0; i < count; i++){
          if(args[i].name === "status"){
            const dat = args.find(arg => arg.name.toLowerCase() == "status").value;
            axios.post(`https://api.itslaunchti.me/update-status?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }
          if(args[i].name === "event"){
            const dat = args.find(arg => arg.name.toLowerCase() == "event").value;
            axios.post(`https://api.itslaunchti.me/update-event?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }
          if(args[i].name === "description"){
            const dat = args.find(arg => arg.name.toLowerCase() == "description").value;
            axios.post(`https://api.itslaunchti.me/update-description?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }

          if(args[i].name === "net"){
            const dat = args.find(arg => arg.name.toLowerCase() == "net").value;
            axios.post(`https://api.itslaunchti.me/update-net?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }

          if(args[i].name === "vehicle"){
            const dat = args.find(arg => arg.name.toLowerCase() == "vehicle").value;
            axios.post(`https://api.itslaunchti.me/update-vehicle?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }

          if(args[i].name === "stages"){
            const dat = args.find(arg => arg.name.toLowerCase() == "stages").value;
            axios.post(`https://api.itslaunchti.me/update-stages?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }

          if(args[i].name === "sn"){
            const dat = args.find(arg => arg.name.toLowerCase() == "sn").value;
            axios.post(`https://api.itslaunchti.me/update-sn?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }

          if(args[i].name === "flightproven"){
            const dat = args.find(arg => arg.name.toLowerCase() == "flightproven").value;
            axios.post(`https://api.itslaunchti.me/update-flightproven?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }

          if(args[i].name === "previousflights"){
            const dat = args.find(arg => arg.name.toLowerCase() == "previousflights").value;
            axios.post(`https://api.itslaunchti.me/update-previousflights?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }

          if(args[i].name === "other"){
            const dat = args.find(arg => arg.name.toLowerCase() == "other").value;
            axios.post(`https://api.itslaunchti.me/update-other?auth=${process.env.AUTHCODE}`, {
              dat: `${dat}`
            })
          }

        }
        client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: `Updated!`
            }
          }
        })
      } else {
        client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: `not a contributor`
            }
          }
        })
      }
    }
  })
});


client.on(`message`, msg => {
  if (msg.author.id != client.user.id) {
    if(msg.author.id === "464440646548324352"){
      if(msg.content.includes("#/")){
        if(msg.content.includes("online")){
          msg.channel.send("Online.")
        }
      }
    }
    if (msg.content.includes(prefix)) {
      const content = msg.content;
      var removeCall = content.replace(prefix, '');

      if (msg.channel.type === 'dm') return;

      const voiceChannel = msg.member.voice.channel;
      if (!voiceChannel) {
        return msg.reply('please join a voice channel first!');
      }

      if (removeCall.includes("play ")) {
        removeCall = removeCall.replace('play ', '');
        msg.suppressEmbeds();
        let nextSong = new Song(removeCall, msg); //initialize a song class for new entry
        songQueue.push(nextSong); //add to queue

        if (!isPlaying) {
          voiceChannel.join().then(connection => {
            vc = voiceChannel;
            conn = connection;
            queueHandler();
          });
        }
      }

      if (removeCall == "now playing" || removeCall == "np") { // Now Playing
        let embed = new Discord.MessageEmbed();
        embed.setColor([212, 115, 210]).setAuthor("Now Playing", client.user.avatarURL());
        if (isPlaying) {
          embed.setTitle(nowPlaying.title).setURL(nowPlaying.url).setDescription(`\`${formatTime(Math.floor(conn.dispatcher.streamTime / 1000))}/${nowPlaying.formattedTime}\``);
          embed.setThumbnail(nowPlaying.info.videoDetails.thumbnails[0].url);
        }
        if (!isPlaying) {
          embed.setDescription("Nothing is currently playing on Launchy");
        }
        embed.setFooter(`Requested by: ${msg.author.username} (${msg.author.tag})`);
        msg.channel.send(embed);
      }

      if (removeCall.includes("q ") || removeCall == "q") {
        sendQueue(msg, parseInt(removeCall.replace('q ', '')));
      }
      if (removeCall.includes("queue ") || removeCall == "queue") {
        sendQueue(msg, parseInt(removeCall.replace('queue ', '')));
      }

      if (removeCall == "stop" || removeCall == "leave") {
        vc.leave();
        isPlaying = false;
        songQueue = [];
        nowPlaying = null;
        msg.channel.send("Launchy Out!");
      }

      if (removeCall == "skip") {
        queueHandler();
        msg.channel.send("Skiping song");
      }

      if (removeCall == "pause") {
        conn.dispatcher.pause();
        msg.channel.send("Pausing");
      }

      if (removeCall == "resume") {
        conn.dispatcher.resume();
        msg.channel.send("Resuming");
      }

      if (removeCall == "cq" || removeCall == "clear") {
        songQueue = []; // Clear queue
        msg.channel.send("Queue cleared");
      }

      if (removeCall.includes("goto ")) {
        removeCall = removeCall.replace('goto ', '');
        var skip = parseInt(removeCall);
        songQueue.splice(0, skip - 1);
        queueHandler();
      }

      if (removeCall.includes("remove ")) {
        removeCall = removeCall.replace('remove ', '');
        msg.channel.send(`Removed ${songQueue[parseInt(removeCall) - 1]} from the queue`);
        songQueue.splice(parseInt(removeCall) - 1, 1);
      } 
    }
  }

  async function sendQueue(msg, page) {
    let embed = new Discord.MessageEmbed().setAuthor("Queue", client.user.avatarURL()).setColor([212,115,210]);
    var songList = [];

    embed.addField("Now Playing", `[${nowPlaying.title}](${nowPlaying.url}) | \`${formatTime(nowPlaying.length)} Requested by: ${nowPlaying.origin.author.username} (${nowPlaying.origin.author.tag})\` \u000A`);
    songQueue.length <= 5 || isNaN(page) ? page = 1 : null;
    let qLeng = (page == 1) ? songQueue.length : songQueue.length - (5 * (page-1));
    let leng = (qLeng > 5) ? 5 : qLeng;
    for (var i = 5 * (page - 1); i < (5 * (page - 1)) + leng; i++) {
      songList[i] = `\`${i + 1}:\`[${songQueue[i].title}](${songQueue[i].url}) | \`${formatTime(songQueue[i].length)} Requested by: ${nowPlaying.origin.author.username} (${nowPlaying.origin.author.tag})\` \u000A`;
    }
    songList[songList.length] = `**${songQueue.length} songs in queue | ${formatTime(queueLength)} total length**`;
    embed.addField("Up Next:", songList);
    embed.setFooter(`Page ${page} of ${Math.ceil(songQueue.length / 5)}`, msg.author.avatarURL());
    msg.channel.send(embed);
  }

  function queueHandler() {
    if (songQueue.length == 0) {
      vc.leave();
      isPlaying = false;
      queueLength = 0;
      nowPlaying = null;
      return;
    }
    if (songQueue.length != 0) {
      const stream = ytdl(songQueue[0].url, { filter: 'audioonly' });
      nowPlaying = songQueue.shift();
      queueLength -= nowPlaying.length;
      const dispatcher = conn.play(stream);

      dispatcher.on('finish', () => queueHandler());
    }
  }
})

client.login(token);