import { Telegraf, Context, Markup } from "telegraf";
import dotenv from "dotenv";
import { ethers, Contract } from "ethers";
import { abi, bytecode } from "./out/SimpleStorage.sol/SimpleStorage.json";
import { FhenixClient, SupportedProvider } from 'fhenixjs';
import { getEncryptedNumber, setEncryptedNumber } from "./helper/fhenixHelper";

dotenv.config();

const token: string = process.env.TELEGRAM_BOT_TOKEN as string;
const bot = new Telegraf(token);

const provider = new ethers.providers.JsonRpcProvider('https://api.nitrogen.fhenix.zone');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

const ContractInstance = new ethers.ContractFactory(abi, bytecode, wallet);
let contract: Contract;

const fhenixClient = new FhenixClient({ provider: provider as unknown as SupportedProvider });

const blockExplorerUrl = 'https://explorer.nitrogen.fhenix.zone/address/';

const channelStatus = new Map<string, ChatStatus>();

enum ChatStatus {
    IDLE = 0,
    AWAITING_INPUT = 1,
}

bot.command('hello', (ctx) => {
    ctx.reply('Hello ' + ctx.from?.first_name + '!');
});

bot.start(ctx => {
    ctx.reply(
        'Hello, I am the Fhenix Telegram Bot\n' +
        'This bot allows you to interact with smart contracts on the Fhenix Nitrogen testnet\n\n' +
        'Choose an option below to get started:\n\n',
        Markup.inlineKeyboard([
            [Markup.button.callback('Deploy a new encrypted storage contract', 'deploy')],
            [Markup.button.callback('Set a new encrypted number', 'setEncrypted')],
            [Markup.button.callback('Get encrypted number', 'getEncrypted')],
        ])
    )
});

bot.action('deploy', async (ctx) => {
    ctx.reply('Deploying contract...');
    contract = await ContractInstance.deploy();
    await contract.deployed();
    console.log('New contract deployed to: ' + contract.address);
    ctx.replyWithMarkdownV2('New contract deployed to [' + contract.address + '](' + blockExplorerUrl +  contract.address + ')')
});

bot.action('getEncrypted', async (ctx) => {
    if(!contract) {
        replyAndLog(ctx, 'No contract deployed yet. Please deploy a contract first.');
        return;
    }

    const result = await getEncryptedNumber(contract, fhenixClient, wallet, provider);
    replyAndLog(ctx, "The stored number is " + result);
});

bot.action('setEncrypted', async (ctx) => {
    if(!contract) {
        ctx.reply('No contract deployed yet. Please deploy a contract first.');
        return;
    }

    ctx.reply('Please enter the number you want to set in the smart contract');
    channelStatus.set(ctx.chat?.id?.toString() as string, ChatStatus.AWAITING_INPUT);
});

bot.on('message', async (ctx) => {
    let input: number = parseUserInputNumber(ctx.text as string, 0);
    if(channelStatus.get(ctx.chat.id.toString()) !== ChatStatus.AWAITING_INPUT) {
        return;
    }
    if(isNaN(input)){
        ctx.reply("invalid input number, plase try again");
        return;
    }

    try{
        await setEncryptedNumber(contract, fhenixClient, input);
    }catch(e){
        ctx.reply("Error processing request : " + (e as Error).message);
        return;
    }
    
    channelStatus.set(ctx.chat.id.toString(), ChatStatus.IDLE);

    replyAndLog(ctx, "Number set to encrypted " + input);
});

function parseUserInputNumber(input: string, offset: number): number {
    return +input.slice(offset).trim();
}

function replyAndLog(ctx: Context, message: string) {
    console.log(message);
    ctx.reply(message);
}

bot.launch();

console.log("Telegram FHE Bot is running ...")
