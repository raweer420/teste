const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const playdl = require('play-dl');

class MusicManager {
  constructor(client) {
    this.client = client;
    this.players = new Map(); // Mapa para guardar players por servidor
    this.queues = new Map(); // Mapa para guardar filas por servidor
  }

  async addSong(interaction, query) {
    const guild = interaction.guild;
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.followUp('❌ Você precisa estar em um canal de voz');
    }

    // Validar e obter URL
    let videoUrl = query;
    if (!playdl.yt_validate(query)) {
      const searchResults = await playdl.search(query, { limit: 1 });
      
      if (searchResults.length === 0) {
        return interaction.followUp('❌ Nenhuma música encontrada');
      }
      
      videoUrl = searchResults[0].url;
    }

    // Obter informações do vídeo
    const videoInfo = await playdl.video_info(videoUrl);

    // Preparar a música para adicionar à fila
    const song = {
      title: videoInfo.video_details.title,
      url: videoUrl,
      duration: videoInfo.video_details.durationRaw
    };

    // Gerenciar fila do servidor
    if (!this.queues.has(guild.id)) {
      this.queues.set(guild.id, []);
    }
    const queue = this.queues.get(guild.id);
    queue.push(song);

    // Se já não estiver tocando, iniciar reprodução
    if (queue.length === 1) {
      await this.playSong(interaction, voiceChannel);
    } else {
      await interaction.followUp(`🎵 Música adicionada à fila: **${song.title}**`);
    }
  }

  async playSong(interaction, voiceChannel) {
    const guild = interaction.guild;
    const queue = this.queues.get(guild.id);

    if (!queue || queue.length === 0) return;

    const song = queue[0];

    // Conectar ao canal de voz
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });

    // Criar player de áudio
    const player = createAudioPlayer({
      behaviors: {
        maxMissedFrames: 5
      }
    });

    // Criar recurso de áudio
    const stream = await playdl.stream(song.url, { 
      discordPlayerCompatibility: true 
    });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      metadata: song
    });

    // Configurar eventos
    player.on(AudioPlayerStatus.Idle, async () => {
      // Remover música atual da fila
      queue.shift();

      // Se ainda houver músicas, tocar próxima
      if (queue.length > 0) {
        await this.playSong(interaction, voiceChannel);
      } else {
        // Desconectar quando a fila estiver vazia
        connection.destroy();
      }
    });

    player.on('error', error => {
      console.error('Erro no player:', error);
      queue.shift();
      interaction.channel.send(`❌ Erro ao tocar música: ${error.message}`);
      
      // Tentar tocar próxima música
      if (queue.length > 0) {
        this.playSong(interaction, voiceChannel);
      } else {
        connection.destroy();
      }
    });

    // Tocar música
    player.play(resource);
    connection.subscribe(player);

    // Mensagem de Now Playing
    await interaction.followUp(`🎵 Tocando agora: **${song.title}**`);
  }

  // Método para pular música
  skip(interaction) {
    const guild = interaction.guild;
    const queue = this.queues.get(guild.id);

    if (!queue || queue.length === 0) {
      return interaction.reply('❌ Não há músicas na fila para pular');
    }

    // Remover música atual
    queue.shift();

    // Se ainda houver músicas, tocar próxima
    if (queue.length > 0) {
      const voiceChannel = interaction.member.voice.channel;
      this.playSong(interaction, voiceChannel);
      interaction.reply('⏭️ Música pulada');
    } else {
      interaction.reply('⏹️ Fila de músicas finalizada');
    }
  }

  // Método para parar música
  stop(interaction) {
    const guild = interaction.guild;
    
    // Limpar fila
    this.queues.set(guild.id, []);
    
    // Destruir conexão de voz
    const connection = this.client.voice?.connections.get(guild.id);
    if (connection) {
      connection.destroy();
    }
    
    interaction.reply('⏹️ Reprodução de música parada');
  }
}

function setupMusicManager(client) {
  const musicManager = new MusicManager(client);
  client.musicManager = musicManager;
  return musicManager;
}

module.exports = setupMusicManager;