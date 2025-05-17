// commands/music/pause.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa ou retoma a reprodução da música atual'),
  
  async execute(interaction) {
    // Verificar se o usuário está em um canal de voz
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return await interaction.reply('❌ Você precisa estar em um canal de voz para usar este comando!');
    }
    
    try {
      // Usar o novo musicManager em vez do distube
      const musicManager = interaction.client.musicManager;
      
      if (!musicManager) {
        return await interaction.reply('❌ Sistema de música não está funcionando corretamente.');
      }
      
      const guildId = interaction.guild.id;
      const queue = musicManager.getQueue(guildId);
      
      if (!queue || !queue.playing) {
        return await interaction.reply('❌ Não há nada tocando no momento!');
      }
      
      // Pausar ou retomar
      const isPaused = musicManager.pause(guildId);
      
      if (isPaused) {
        await interaction.reply('⏸️ Música pausada!');
      } else {
        await interaction.reply('▶️ Reprodução retomada!');
      }
    } catch (error) {
      console.error('Erro ao executar comando pause:', error);
      await interaction.reply(`❌ Ocorreu um erro: ${error.message || 'Erro desconhecido'}`);
    }
  }
};