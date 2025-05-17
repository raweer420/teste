// Esta deve ser a primeira linha do arquivo
require('./preload');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const setupMusicManager = require('./helpers/musicPlayerDirect');
const { setupPlayDl } = require('./preload');

// Função para mostrar uma mensagem bonita de inicialização
function showStartupMessage() {
  console.log('='.repeat(50));
  console.log('BOT DISCORD - SISTEMA DE VERIFICAÇÃO, LOGS E MÚSICA');
  console.log('='.repeat(50));
  console.log(`• Iniciado em: ${new Date().toLocaleString()}`);
  console.log(`• Prefixo: ${config.PREFIX}`);
  console.log(`• Canal de logs: ${config.LOG_CHANNEL_ID}`);
  console.log(`• Canal de verificação: ${config.VERIFY_CHANNEL_ID}`);
  console.log(`• Canal da staff: ${config.STAFF_CHANNEL_ID}`);
  console.log('='.repeat(50));
}

// Inicializar o cliente Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  // Adicionar opções de otimização
  sweepers: {
    messages: {
      interval: 60, // 1 minuto
      lifetime: 3600 // 1 hora
    }
  },
  restTimeOffset: 0 // Reduzir tempo de espera entre requisições à API
});

// Coleções para armazenar comandos e cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Mostrar mensagem de inicialização
showStartupMessage();

// Função para verificar se o usuário tem o cargo NUKE_ROLE_ID
function checkPermission(message) {
  if (!message.guild) return false;
  if (message.guild.ownerId === message.author.id) return true;
  return message.member.roles.cache.has(config.NUKE_ROLE_ID);
}

// Carregar eventos
console.log('==== CARREGAMENTO DE EVENTOS ====');
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  try {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    const eventName = event.name || file.split('.')[0];
    
    if (event.execute) {
      if (event.once) {
        client.once(eventName, (...args) => event.execute(client, ...args));
      } else {
        client.on(eventName, (...args) => event.execute(client, ...args));
      }
      console.log(`✅ Evento carregado: ${eventName}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao carregar evento ${file}:`, error);
  }
}

// Carregar comandos
console.log('==== CARREGAMENTO DE COMANDOS ====');
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) continue;
  
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
  console.log(`Comandos na pasta ${folder}: ${commandFiles.join(', ')}`);
  
  for (const file of commandFiles) {
    try {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);
      
      if (command.name) {
        command.category = folder.charAt(0).toUpperCase() + folder.slice(1);
        client.commands.set(command.name, command);
        console.log(`✅ Comando carregado: ${command.name}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar comando ${file}:`, error);
    }
  }
}

// Sistema de comandos
client.on('messageCreate', async message => {
  // Ignorar mensagens que não começam com o prefixo ou são de bots
  if (!message.content.startsWith(config.PREFIX) || message.author.bot) return;

  const args = message.content.slice(config.PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) || 
                 client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  // Verificar permissões
  if (!['music', 'utility'].includes(command.category.toLowerCase()) && !checkPermission(message)) {
    return message.reply('❌ Você não tem permissão para usar comandos de administração.')
      .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  // Sistema de cooldown
  const { cooldowns } = client;
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`⏱️ Aguarde ${timeLeft.toFixed(1)} segundos antes de usar o comando \`${command.name}\` novamente.`)
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // Executar comando com try/catch para evitar quedas
  try {
    console.log(`🔄 Executando comando: ${command.name} (Usuário: ${message.author.tag})`);
    await command.execute(message, args, client);
  } catch (error) {
    console.error(`Erro no comando ${command.name}:`, error);
    message.reply('❌ Ocorreu um erro ao executar este comando.')
      .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }
});

// Evento para testar o bot (comando direto)
client.on('messageCreate', message => {
  if (message.content === '!!teste') {
    const pingMs = Date.now() - message.createdTimestamp;
    message.reply(`✅ Bot funcionando! Ping: ${pingMs}ms | API: ${Math.round(client.ws.ping)}ms`);
  }
});

// Evento ready do bot
client.once('ready', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  
  // Configurar play-dl primeiro
  await setupPlayDl();

  // Definir status do bot
  client.user.setActivity('música | !help', { type: 'LISTENING' });
  
  // Inicializar o sistema de música com play-dl
  console.log('🎵 Inicializando sistema de música com play-dl...');
  try {
    const musicManager = setupMusicManager(client);
    if (musicManager) {
      client.musicManager = musicManager;
      console.log('✅ Sistema de música inicializado com sucesso!');
    } else {
      console.error('❌ Falha ao inicializar o sistema de música.');
    }
  } catch (error) {
    console.error('❌ Erro ao configurar sistema de música:', error);
  }
  
  // Tentar enviar mensagem no canal de logs
  try {
    const logChannel = await client.channels.fetch(config.LOG_CHANNEL_ID);
    if (logChannel) {
      logChannel.send({
        embeds: [{
          title: '🟢 Bot Iniciado',
          description: `Bot foi iniciado com sucesso em ${new Date().toLocaleString()}`,
          color: 0x00FF00,
          fields: [
            { name: '🎵 Sistema de Música', value: 'Ativado', inline: true },
            { name: '📝 Sistema de Logs', value: 'Ativado', inline: true },
            { name: '✅ Sistema de Verificação', value: 'Ativado', inline: true }
          ]
        }]
      }).then(() => {
        console.log('✅ Mensagem enviada ao canal de logs');
      }).catch(error => {
        console.error('❌ Erro ao enviar mensagem para o canal de logs:', error);
      });
    } else {
      console.error('❌ Canal de logs não encontrado!');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar canal de logs:', error);
  }
});

// Lidar com erros não tratados
process.on('unhandledRejection', error => {
  console.error('Erro não tratado:', error);
});

// Login do bot
console.log('Conectando ao Discord...');
client.login(config.TOKEN).then(() => {
  console.log('✅ Bot conectado ao Discord com sucesso!');
}).catch(error => {
  console.error('❌ Erro ao conectar ao Discord:', error);
  process.exit(1);
});