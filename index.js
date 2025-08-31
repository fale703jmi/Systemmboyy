import { Client, GatewayIntentBits, Partials, PermissionsBitField, EmbedBuilder } from "discord.js";
import { REST, Routes } from "@discordjs/rest";
import ms from "ms";
import fs from "fs";

const TOKEN     = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID  = process.env.GUILD_ID;
const OWNER_ID  = process.env.OWNER_ID || "1268018033268621455";

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ لازم TOKEN / CLIENT_ID / GUILD_ID");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

// ====== Warnings Store ======
const WARN_PATH = "./warnings.json";
let warns = {};
try { warns = JSON.parse(fs.readFileSync(WARN_PATH,"utf8")); } catch { warns = {}; }
function saveWarns(){ fs.writeFileSync(WARN_PATH, JSON.stringify(warns,null,2)); }

function isMod(m){ return m.id===OWNER_ID || m.permissions.has(PermissionsBitField.Flags.Administrator); }

// ====== Slash Commands ======
const commands = [
  { name:"warn", description:"تحذير عضو", options:[{name:"user",description:"العضو",type:6,required:true},{name:"reason",description:"السبب",type:3}]},
  { name:"unwarn", description:"إزالة تحذير", options:[{name:"user",type:6,required:true},{name:"index",type:4,required:true}]},
  { name:"warns", description:"عرض تحذيرات", options:[{name:"user",type:6,required:true}]}
];

async function register(){
  const rest = new REST({version:"10"}).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID,GUILD_ID),{body:commands});
  console.log("✅ Commands registered");
}

client.once("ready",()=>{ 
  console.log("✅ Logged in as "+client.user.tag); 
  register(); 
});

// ====== Slash Handling ======
client.on("interactionCreate", async (i)=>{
  if(!i.isChatInputCommand()) return;
  if(!isMod(i.member)) return i.reply({content:"🚫 ماعندك صلاحية",ephemeral:true});

  if(i.commandName==="warn"){
    const u = i.options.getUser("user",true);
    const r = i.options.getString("reason")||"بدون سبب";
    if(!warns[i.guild.id]) warns[i.guild.id]={};
    if(!warns[i.guild.id][u.id]) warns[i.guild.id][u.id]=[];
    warns[i.guild.id][u.id].push({by:i.user.id,reason:r,time:Date.now()});
    saveWarns();
    return i.reply(`⚠️ تحذير ${u} | السبب: ${r}`);
  }
  if(i.commandName==="unwarn"){
    const u=i.options.getUser("user",true);
    const idx=i.options.getInteger("index",true)-1;
    const arr=warns?.[i.guild.id]?.[u.id]||[];
    if(idx<0||idx>=arr.length) return i.reply("❌ رقم خطأ");
    arr.splice(idx,1);
    saveWarns();
    return i.reply(`🗑️ إزالة تحذير من ${u}`);
  }
  if(i.commandName==="warns"){
    const u=i.options.getUser("user",true);
    const arr=warns?.[i.guild.id]?.[u.id]||[];
    if(!arr.length) return i.reply(`${u} مافيه تحذيرات`);
    const lines=arr.map((w,i)=>`${i+1}. ${w.reason} — <@${w.by}>`).join("\n");
    const e=new EmbedBuilder().setTitle("تحذيرات "+u.tag).setDescription(lines).setColor("Yellow");
    return i.reply({embeds:[e]});
  }
});

// ====== Message Commands ======
client.on("messageCreate", async (m)=>{
  if(!m.guild||m.author.bot) return;
  const member=await m.guild.members.fetch(m.author.id).catch(()=>null);
  if(!member) return;
  const content=m.content.trim();

  if(isMod(member)){
    if(content==="قفل"){
      await m.channel.permissionOverwrites.edit(m.guild.id,{SendMessages:false});
      return m.reply("🔒 تم قفل القناة.");
    }
    if(content==="فتح"){
      await m.channel.permissionOverwrites.edit(m.guild.id,{SendMessages:true});
      return m.reply("🔓 تم فتح القناة.");
    }
    if(content==="اخفاء"){
      await m.channel.permissionOverwrites.edit(m.guild.id,{ViewChannel:false});
      return m.reply("🙈 تم إخفاء القناة.");
    }
    if(content==="اظهار" || content==="إظهار"){
      await m.channel.permissionOverwrites.edit(m.guild.id,{ViewChannel:true});
      return m.reply("👀 تم إظهار القناة.");
    }
    const match=content.match(/^مسح\s+(\d{1,3})$/);
    if(match){
      const n=Math.min(100,parseInt(match[1]));
      await m.channel.bulkDelete(n,true);
      return m.reply(`🧹 مسحت ${n} رسالة.`);
    }
  }

  // ====== Funny Ban Commands ======
  if(isMod(member)){
    const banMatch=content.match(/^(تفو|برجلي)\s+<@!?(\\d+)>/i);
    if(banMatch){
      const trigger=banMatch[1];
      const uid=banMatch[2];
      const target=await m.guild.members.fetch(uid).catch(()=>null);
      if(target && target.bannable){
        await target.ban({reason:`${trigger} by ${member.user.tag}`});
        if(trigger==="برجلي"){
          return m.channel.send("تسلم رجلك هههههههههههههههههههههههههههههههههههههههههههههههههههههههههه");
        }
        if(trigger==="تفو"){
          return m.channel.send("يقطع ام الزححف هههههههههههههههههههههههههههههههههههههههههههههههههههههههههه");
        }
      }
    }
  }
});

client.login(TOKEN);
