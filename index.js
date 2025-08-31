const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

const prefix = ""; // بدون بريفكس

client.once('ready', () => {
    console.log(`✅ تم تسجيل الدخول كـ ${client.user.tag}`);
});

// ===================== الأوامر ======================

// باند
client.on("messageCreate", async (message) => {
    if (message.content.startsWith("باند")) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
        const member = message.mentions.members.first();
        if (member) {
            await member.ban();
            await message.react("✅");
        }
    }

    // طرد
    if (message.content.startsWith("طرد")) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
        const member = message.mentions.members.first();
        if (member) {
            await member.kick();
            await message.react("✅");
        }
    }

    // كتم (Mute)
    if (message.content.startsWith("كتم")) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
        const member = message.mentions.members.first();
        if (member) {
            await member.timeout(24 * 60 * 60 * 1000, "Muted by bot"); // يوم كامل
            await message.react("✅");
        }
    }

    // تايم اوت
    if (message.content.startsWith("تايم اوت")) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
        const member = message.mentions.members.first();
        if (member) {
            await member.timeout(10 * 60 * 1000, "Timeout"); // 10 دقايق
            await message.react("✅");
        }
    }

    // مسح
    if (message.content.startsWith("مسح")) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        let args = message.content.split(" ");
        let amount = parseInt(args[1]);
        if (!amount || isNaN(amount)) amount = 1;
        await message.channel.bulkDelete(amount, true);
        await message.react("✅");
    }

    // اخفاء
    if (message.content === "اخفاء") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
        await message.channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: false });
        await message.react("✅");
    }

    // اظهار
    if (message.content === "اظهار") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
        await message.channel.permissionOverwrites.edit(message.guild.id, { ViewChannel: true });
        await message.react("✅");
    }

    // قفل
    if (message.content === "قفل") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
        await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
        await message.react("✅");
    }

    // فتح
    if (message.content === "فتح") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
        await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true });
        await message.react("✅");
    }

    // ديفن
    if (message.content.startsWith("ديفن")) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.DeafenMembers)) return;
        const member = message.mentions.members.first();
        if (member && member.voice.channel) {
            await member.voice.setDeaf(true);
            await message.react("✅");
        }
    }

    // Unban all
    if (message.content === "unban all" || message.content === "فك الباند") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
        const bans = await message.guild.bans.fetch();
        bans.forEach(async (ban) => {
            await message.guild.members.unban(ban.user.id);
        });
        await message.react("✅");
    }

    // =================== الردود المخصصة ===================

    if (message.content.includes("برجلي")) {
        message.reply("تسلم رجلك هههههههههههههههههههههههههههههههههههههههههههههههههههههههههه");
    }

    if (message.content.includes("تفو")) {
        message.reply("يقطع ام الزححف هههههههههههههههههههههههههههههههههههههههههههههههههههههههههه");
    }
});

// =======================================================

client.login(process.env.TOKEN);