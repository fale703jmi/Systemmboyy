import { Client, GatewayIntentBits, Partials, PermissionsBitField } from "discord.js";

const TOKEN = process.env.TOKEN;
const OWNER_ID = process.env.OWNER_ID || "1268018033268621455";

if (!TOKEN) {
  console.error("❌ حط TOKEN في Environment");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,        // للأوامر الإدارية
    GatewayIntentBits.GuildMessages,       // قراءة الرسائل
    GatewayIntentBits.MessageContent,      // بدون بريفكس
    GatewayIntentBits.GuildVoiceStates     // ميوت/ديفن/تايم أوت صوت
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User, Partials.GuildMember]
});

function isMod(member) {
  return member?.id === OWNER_ID || member?.permissions?.has(PermissionsBitField.Flags.Administrator);
}

function getMentionedMember(message) {
  return message.mentions.members.first() || null;
}

async function ensureMutedRole(guild) {
  let role = guild.roles.cache.find(r => r.name === "Muted");
  if (!role) {
    role = await guild.roles.create({ name: "Muted", reason: "Text mute role", hoist: false });
    // امنع الكتابة والتكلم لكل القنوات
    for (const [, ch] of guild.channels.cache) {
      await ch.permissionOverwrites.edit(role, {
        SendMessages: false,
        AddReactions: false,
        Speak: false
      }).catch(() => {});
    }
  }
  return role;
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// لوج أغلاق الجيتواي للتشخيص
client.ws.on("close", (code, reason) => {
  console.error("Gateway closed:", code, reason?.toString?.() || "");
});

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  const member = await message.guild.members.fetch(message.author.id).catch(() => null);
  if (!member || !isMod(member)) return; // بس الأدمن/الأونر

  const content = message.content.trim();
  const args = content.split(/\s+/);
  const cmd = args[0].toLowerCase();
  const mentioned = getMentionedMember(message);

  // ======== مسح الرسائل ========
  if (cmd === "مسح" || cmd === "clear") {
    const amount = parseInt(args[1], 10);
    if (!amount || amount < 1 || amount > 100) return message.reply("اكتب عدد بين 1 و 100 مثل: `مسح 50`");
    const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
    const m = await message.channel.send(`🧹 تم مسح ${deleted ? deleted.size : amount} رسالة.`);
    setTimeout(() => m.delete().catch(()=>{}), 3000);
    return;
  }

  // ======== قفل/فتح وإخفاء/إظهار ========
  if (["قفل","lock"].includes(cmd)) {
    await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false }).catch(()=>{});
    return void message.channel.send("🔒 تم قفل القناة.");
  }
  if (["فتح","unlock"].includes(cmd)) {
    await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true }).catch(()=>{});
    return void message.channel.send("🔓 تم فتح القناة.");
  }
  if (["اخفاء","hide"].includes(cmd)) {
    await message.channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: false }).catch(()=>{});
    return void message.channel.send("🙈 تم إخفاء القناة.");
  }
  if (["اظهار","إظهار","show"].includes(cmd)) {
    await message.channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: true }).catch(()=>{});
    return void message.channel.send("👀 تم إظهار القناة.");
  }

  // ======== BAN / KICK ========
  if ((cmd === "باند" || cmd === "ban") && mentioned) {
    await mentioned.ban({ reason: `By ${member.user.tag}` }).catch(()=>{});
    await message.react("✅").catch(()=>{});
    return void message.channel.send(`⛔ ${mentioned.user.tag} تم حظره.`);
  }
  if ((cmd === "طرد" || cmd === "kick") && mentioned) {
    await mentioned.kick(`By ${member.user.tag}`).catch(()=>{});
    return void message.channel.send(`👢 ${mentioned.user.tag} تم طرده.`);
  }

  // ======== UNBAN ALL ========
  if (cmd === "unbanall" || cmd === "فك-كل-الباند") {
    const bans = await message.guild.bans.fetch().catch(()=>null);
    if (!bans) return void message.channel.send("ما قدرت أجيب قائمة المبندين.");
    let count = 0;
    for (const [, ban] of bans) {
      await message.guild.members.unban(ban.user.id).catch(()=>{});
      count++;
    }
    return void message.channel.send(`🔓 تم فك الحظر عن ${count} عضو.`);
  }

  // ======== Funny BAN (برجلي / تفو) ========
  if (cmd === "برجلي" && mentioned) {
    await mentioned.ban({ reason: `Funny ban by ${member.user.tag}` }).catch(()=>{});
    await message.react("✅").catch(()=>{});
    return void message.channel.send("تسلم رجلك هههههههههههههههههههههههههههههههههههههههههههههههههههههههههه");
  }
  if (cmd === "تفو" && mentioned) {
    await mentioned.ban({ reason: `Funny ban by ${member.user.tag}` }).catch(()=>{});
    await message.react("✅").catch(()=>{});
    return void message.channel.send("يقطع ام الزححف هههههههههههههههههههههههههههههههههههههههههههههههههههههههههه");
  }

  // ======== ميوت/فك ميوت صوت (server voice) ========
  if ((cmd === "كتم" || cmd === "mute") && mentioned) {
    await mentioned.voice.setMute(true).catch(()=>{});
    return void message.channel.send(`🔇 ${mentioned.user.tag} تم كتمه صوتيًا.`);
  }
  if ((cmd === "فك" || cmd === "unmute") && mentioned) {
    await mentioned.voice.setMute(false).catch(()=>{});
    return void message.channel.send(`🔊 ${mentioned.user.tag} تم فك الميوت الصوتي.`);
  }

  // ======== ديفن/فك الديفن ========
  if ((cmd === "ديفن" || cmd === "deafen") && mentioned) {
    await mentioned.voice.setDeaf(true).catch(()=>{});
    return void message.channel.send(`🙉 ${mentioned.user.tag} تم عمل ديفن.`);
  }
  if ((cmd === "فك-الديفن" || cmd === "undeafen") && mentioned) {
    await mentioned.voice.setDeaf(false).catch(()=>{});
    return void message.channel.send(`👂 ${mentioned.user.tag} تم فك الديفن.`);
  }

  // ======== Timeout / Un-timeout ========
  if ((cmd === "تايم" || cmd === "timeout") && mentioned) {
    // مثال: "تايم اوت @عضو 10" أو "timeout @member 10"
    const minutes = parseInt(args[2] || args[1], 10) || 10;
    const ms = minutes * 60 * 1000;
    await mentioned.timeout(ms, `By ${member.user.tag}`).catch(()=>{});
    return void message.channel.send(`⏰ ${mentioned.user.tag} تايم أوت ${minutes} دقيقة.`);
  }
  if ((cmd === "إلغاء" || cmd === "untimeout" || cmd === "cancel-timeout") && mentioned) {
    await mentioned.timeout(null).catch(()=>{});
    return void message.channel.send(`✅ ${mentioned.user.tag} تم إلغاء التايم أوت.`);
  }

  // ======== ميوت كتابي (القناة الحالية) ========
  if ((cmd === "ميوت-كتابي" || cmd === "textmute") && mentioned) {
    await message.channel.permissionOverwrites.edit(mentioned.id, { SendMessages: false }).catch(()=>{});
    return void message.channel.send(`✏️ ${mentioned.user.tag} تم منعه من الكتابة هنا.`);
  }
  if ((cmd === "فك-الميوت-كتابي" || cmd === "untextmute") && mentioned) {
    await message.channel.permissionOverwrites.edit(mentioned.id, { SendMessages: true }).catch(()=>{});
    return void message.channel.send(`✅ ${mentioned.user.tag} يقدر يكتب الآن.`);
  }

  // ======== ميوت كتابي عام (Role Muted لكل السيرفر) ========
  if ((cmd === "ميوت-عام" || cmd === "globalmute") && mentioned) {
    const role = await ensureMutedRole(message.guild);
    await mentioned.roles.add(role).catch(()=>{});
    return void message.channel.send(`🚫 ${mentioned.user.tag} تم منعه من الكتابة والتكلم بالسيرفر.`);
  }
  if ((cmd === "فك-الميوت-عام" || cmd === "unglobalmute") && mentioned) {
    const role = message.guild.roles.cache.find(r => r.name === "Muted");
    if (role && mentioned.roles.cache.has(role.id)) {
      await mentioned.roles.remove(role).catch(()=>{});
    }
    return void message.channel.send(`✅ ${mentioned.user.tag} تم فك الميوت العام.`);
  }

  // ======== EN Aliases quick ========
  if (cmd === "lock")  { await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false }); return void message.channel.send("🔒 Channel locked."); }
  if (cmd === "unlock"){ await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true  }); return void message.channel.send("🔓 Channel unlocked."); }
  if (cmd === "hide")  { await message.channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: false }); return void message.channel.send("🙈 Channel hidden."); }
  if (cmd === "show")  { await message.channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: true  }); return void message.channel.send("👀 Channel shown."); }

});

client.login(TOKEN);