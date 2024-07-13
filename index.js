import { config } from "dotenv";
import { Client, Constants, EmbedBuilder, Events } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import OpenAI from "openai";
import { franc } from "franc-min";
config();

const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.once("ready", () => {
  console.log("The bot is online");

  const askSlash = new SlashCommandBuilder()
    .setName("ask")
    .setDescription(
      "Ask questions about Premiere Pro, DaVinci Resolve, After Effects, and Photoshop."
    )
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("Enter your question")
        .setRequired(true)
    );

  client.application.commands
    .set([askSlash.toJSON()])
    .then(() => console.log("Slash command registered"))
    .catch(console.error);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === "ask") {
      const question = options.getString("question");
      console.log(`Received question: ${question}`);

      await interaction.deferReply({ ephemeral: true });

      const language = franc(question);
      console.log(`language is :\n ${language} `);
      if (language !== "fra") {
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Avertissement!")
          .setDescription("Veuillez poser uniquement des questions en français")
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const response = await openai.chat.completions
        .create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You can only answer questions about Premiere Pro, DaVinci Resolve, After Effects, Photoshop. And you can only speak French.",
            },
            {
              role: "user",
              content: question,
            },
          ],
        })
        .catch((error) => console.log(`OpenAI api error :\n ${error} `));

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Answer!")
        .setDescription(`${response.choices[0].message.content}`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    console.log(`DC error :\n ${error}`);
  }
});

client.login(process.env.DC_API_KEY);
