exports.run = async(client, message, args) => {
  let user = message.mentions.users.first() || message.author;
  if(!user) return message.channel.send("⚠ Birisini Etiketlemelisin!")
 let invites = await message.guild.fetchInvites() 
  let regular = invites.array().find(invite => invite.inviter.id === user.id) ? invites.find(invite => invite.inviter.id === user.id).uses : 0
 
  message.channel.send(`🔥 Toplam \`${regular}\` Davetin Var!`)
}
exports.conf = {
  aliases: ["davetlerim"],
permLevel: 0
}

exports.help = {
  name: 'davetsayım',
  açıklama: '',
  çalcanmı: ''
};