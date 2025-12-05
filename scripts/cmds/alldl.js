const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');

const pipeline = promisify(stream.pipeline);
const API_BASE_URL = "https://neoaz.is-a.dev/api/alldl"; 
const CACHE_DIR = path.join(__dirname, 'cache');

async function download({ videoUrl, message, event }) {
  const apiUrl = `${API_BASE_URL}?url=${encodeURIComponent(videoUrl)}`;
  
  let tempFilePath = null;
  
  try {
    message.reaction("⏳", event.messageID);
    const apiResponse = await axios.get(apiUrl, { timeout: 30000 });
    const videoData = apiResponse.data;

    if (!videoData || !videoData.cdnUrl) {
      throw new Error("Invalid response or missing CDN URL from API.");
    }
    
    let title = 'Video Download';
    let platform = 'Unknown Source';

    if (videoData.data) {
        title = videoData.data.title || title;
        platform = videoData.data.source || platform;
    }

    const cdnUrl = videoData.cdnUrl;

    const videoStreamResponse = await axios.get(cdnUrl, {
      responseType: 'stream',
      timeout: 120000 
    });
    
    if (!fs.existsSync(CACHE_DIR)) {
        await fs.mkdirp(CACHE_DIR);
    }

    const filename = `${Date.now()}_${title.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.mp4`;
    tempFilePath = path.join(CACHE_DIR, filename);

    const writer = fs.createWriteStream(tempFilePath);
    videoStreamResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    await message.reply({
      body: `Video downloaded ✨\nTitle: ${title}\nPlatform: ${platform}`,
      attachment: fs.createReadStream(tempFilePath)
    });
    
    message.reaction("✅", event.messageID);

  } catch (error) {
    message.reaction("❌", event.messageID);
    
    console.error("Download Error:", error.message || error);
    
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.unlink(tempFilePath).catch(console.error);
    }
  }
}

module.exports = {
  config: {
    name: "alldl",
    aliases: ["download", "dl", "instadl", "fbdl", "xdl", "tikdl"],
    version: "2.4", 
    author: "Nabin", 
    countDown: 5,
    role: 0,
    longDescription: "Download Videos from various Sources and toggle auto-download.",
    category: "media",
    guide: { en: { body: "{p}{n} [video link] or {p}{n} on/off to toggle auto-download." } }
  },

  onStart: async function({ message, args, event, threadsData, role }) {
    let videoUrl = args.join(" ");
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const toggleCommand = args[0] === 'on' || args[0] === 'off';
    
    if (toggleCommand) {
      if (role >= 1) {
        const choice = args[0] === 'on';
        await threadsData.set(event.threadID, { data: { autoDownload: choice } });
        return message.reply(`Auto-download has been turned ${choice ? 'on' : 'off'} for this group.`);
      } else {
        return message.reply("You don't have permission to toggle auto-download.");
      }
    }

    if (!videoUrl) {
      if (event.messageReply && event.messageReply.body) {
        const foundURLs = event.messageReply.body.match(urlRegex);
        if (foundURLs && foundURLs.length > 0) {
          videoUrl = foundURLs[0];
        } 
      }
    }

    if (!videoUrl || !videoUrl.match(urlRegex)) {
      return message.reply("No valid URL found. Please provide a video link or reply to a message containing one.");
    }

    message.reaction("⏳", event.messageID);
    await download({ videoUrl, message, event });
  },

  onChat: async function({ event, message, threadsData }) {
    const threadData = await threadsData.get(event.threadID);
    if (!threadData || !threadData.data || !threadData.data.autoDownload || event.senderID === global.botID) return;

    try {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const foundURLs = event.body.match(urlRegex);

      if (foundURLs && foundURLs.length > 0) {
        const videoUrl = foundURLs[0];
        message.reaction("⏳", event.messageID); 
        await download({ videoUrl, message, event });
      }
    } catch (error) {
      console.error("onChat Auto-Download Error:", error);
    }
  }
};
