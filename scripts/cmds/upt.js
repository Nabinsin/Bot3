const os = require("os");

module.exports = {
  config: {
    name: "uptime",
    version: "2.2",
    author: "Nabin",
    role: 0,
    shortDescription: "Show bot uptime info",
    longDescription: "Display stylish uptime, system stats, RAM, prefix, threads, etc.",
    category: "system",
    guide: "{pn}"
  },

  onStart: async function ({ message, threadsData }) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / (60 * 60 * 24));
    const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    const seconds = Math.floor(uptime % 60);

    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const cpu = os.cpus()[0].model;
    const cores = os.cpus().length;
    const platform = os.platform();
    const arch = os.arch();
    const nodeVersion = process.version;
    const hostname = os.hostname();

    const totalMem = os.totalmem() / 1024 / 1024;
    const freeMem = os.freemem() / 1024 / 1024;
    const usedMem = totalMem - freeMem;

    const prefix = global.GoatBot.config.PREFIX || "/";
    const totalThreads = await threadsData.getAll().then(t => t.length);
    const totalCommands = global.GoatBot.commands.size;

    const line = "═".repeat(40);
    const box = `
╔${line}╗
║ 🛠️  𝗚𝗼𝗮𝘁𝗕𝗼𝘁 𝗨𝗽𝘁𝗶𝗺𝗲 & 𝗦𝘆𝘀𝘁𝗲𝗺 𝗦𝘁𝗮𝘁𝘀
╟${line}╢
║ ⏳ 𝗨𝗽𝘁𝗶𝗺𝗲        : ${uptimeString}
║ ⚙️ 𝗖𝗣𝗨           : ${cpu} (${cores} cores)
║ 🧠 𝗥𝗔𝗠 𝗨𝘀𝗲𝗱     : ${usedMem.toFixed(2)} MB / ${totalMem.toFixed(2)} MB
║ 💾 𝗣𝗹𝗮𝘁𝗳𝗼𝗿𝗺      : ${platform} (${arch})
║ 🖥️ 𝗛𝗼𝘀𝘁𝗻𝗮𝗺𝗲      : ${hostname}
║ 🔢 𝗧𝗵𝗿𝗲𝗮𝗱𝘀      : ${totalThreads}
║ 🧩 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀     : ${totalCommands}
║ 🧪 𝗡𝗼𝗱𝗲.𝗷𝘀       : ${nodeVersion}
║ 🪄 𝗣𝗿𝗲𝗳𝗶𝘅        : ${prefix}
║ 👑 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿     : 𝗡𝗮𝗯𝗶𝗻 𝘀𝗶𝗻𝗴𝗷𝗮𝗹𝗶
╚${line}╝`;

    message.reply(box);
  }
};
