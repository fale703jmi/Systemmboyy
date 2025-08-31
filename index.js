const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
});

const prefix = ""; // بدون بريفكس

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ✅ ردود خاصة
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.includes("برجلي")) {
    return message.reply("✅ تسلم رجلك ههههههههههههههههههههههههههههههههههههههههههههههههههههههههه");
  }

  if (message.content.includes("تفو")) {
    return message.reply("✅ يقطع أم الزحف ههههههههههههههههههههههههههههههههههههههههههههههههههههههههه");
  }

  // ✅ أوامر إدارية رسمية
  if (message.content.startsWith("باند") || message.content.startsWith("ban")) {
    const member = message.mentions.members.first();
    if (!member) return message.reply("مين تبند؟");
    await member.ban().catch(err => message.reply("ما قدرت أبند"));
    return message.reply("✅ تم تبنيد العضو.");
  }

  if (message.content.startsWith("انباند") || message.content.startsWith("unban")) {
    const args = message.content.split(" ");
    const id = args[1];
    if (!id) return message.reply("حط آيدي العضو");
    await message.guild.members.unban(id).catch(err => message.reply("ما قدرت افك الباند"));
    return message.reply("✅ تم فك الباند عن العضو.");
  }

  if (message.content.startsWith("unban all")) {
    const bans = await message.guild.bans.fetch();
    bans.forEach(async (ban) => {
      await message.guild.members.unban(ban.user.id);
    });
    return message.reply("✅ تم فك الباند عن الجميع.");
  }

  if (message.content.startsWith("كتم") || message.content.startsWith("mute")) {
    const member = message.mentions.members.first();
    if (!member) return message.reply("مين تكتم؟");
    await member.timeout(60 * 60 * 1000).catch(err => message.reply("ما قدرت أكتم"));
    return message.reply("✅ تم كتم العضو ساعة.");
  }

  if (message.content.startsWith("تايم اوت") || message.content.startsWith("timeout")) {
    const member = message.mentions.members.first();
    if (!member) return message.reply("مين تسوي له تايم اوت؟");
    await member.timeout(10 * 60 * 1000).catch(err => message.reply("ما قدرت اسوي تايم اوت"));
    return message.reply("✅ تم إعطاء العضو تايم اوت 10 دقايق.");
  }

  if (message.content.startsWith("طرد") || message.content.startsWith("kick")) {
    const member = message.mentions.members.first();
    if (!member) return message.reply("مين تطرد؟");
    await member.kick().catch(err => message.reply("ما قدرت أطرد"));
    return message.reply("✅ تم طرد العضو.");
  }

  if (message.content.startsWith("مسح") || message.content.startsWith("clear")) {
    const args = message.content.split(" ");
    const amount = parseInt(args[1]);
    if (!amount || isNaN(amount)) return message.reply("حط عدد الرسائل");
    await message.channel.bulkDelete(amount, true).catch(err => message.reply("ما قدرت أمسح"));
    return message.reply(`✅ تم مسح ${amount} رسائل.`);
  }

  if (message.content.startsWith("اخفاء")) {
    await message.channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: false });
    return message.reply("✅ تم إخفاء الشات.");
  }

  if (message.content.startsWith("اظهار")) {
    await message.channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: true });
    return message.reply("✅ تم إظهار الشات.");
  }

  if (message.content.startsWith("قفل")) {
    await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
    return message.reply("✅ تم قفل الشات.");
  }

  if (message.content.startsWith("فتح")) {
    await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true });
    return message.reply("✅ تم فتح الشات.");
  }

  if (message.content.startsWith("ديفن") || message.content.startsWith("deafen")) {
    const member = message.mentions.members.first();
    if (!member || !member.voice.channel) return message.reply("العضو مو بالروم");
    await member.voice.setDeaf(true).catch(err => message.reply("ما قدرت اسوي ديفن"));
    return message.reply("✅ تم عمل ديفن للعضو.");
  }
});

// ✅ شغل البوت
client.login("توكن_البوت");