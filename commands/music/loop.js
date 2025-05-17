// commands/music/loop.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Ativa ou desativa o modo de repetição'),
  
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
      
      // Alternar modo de loop
      const isLoop = musicManager.toggleLoop(guildId);
      
      if (isLoop) {
        await interaction.reply('🔁 Modo de repetição **ativado**!');
      } else {
        await interaction.reply('➡️ Modo de repetição **desativado**!');
      }
    } catch (error) {
      console.error('Erro ao executar comando loop:', error);
      await interaction.reply(`❌ Ocorreu um erro: ${error.message || 'Erro desconhecido'}`);
    }
  }
};