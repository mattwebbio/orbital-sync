#!/usr/bin/env node

import chalk from 'chalk';
import sleep from 'sleep-promise';
import { EventEmitter } from 'events';
import mqtt from 'mqtt';
import { Log } from './log.js';
import { Sync } from './sync.js';
import { Config } from './config/index.js';

// Load Config
const config = Config();
const log = new Log(config.verbose);

// Get MQTT settings from environment variables
const MQTT_BROKER_URL: string | undefined = process.env.MQTT_BROKER_URL;
const MQTT_TOPIC: string = process.env.MQTT_TOPIC || 'orbitalsync/trigger';

// EventEmitter for external triggers
const eventEmitter = new EventEmitter();

// Initialize MQTT only if MQTT_BROKER_URL is provided
let mqttClient: mqtt.MqttClient | null = null;

if (MQTT_BROKER_URL) {
  mqttClient = mqtt.connect(MQTT_BROKER_URL);

  mqttClient.on('connect', () => {
    log.info(chalk.blue(`Connected to MQTT broker at ${MQTT_BROKER_URL}`));
    mqttClient?.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        log.error(chalk.red('Failed to subscribe to MQTT topic!'));
      } else {
        log.info(chalk.blue(`Subscribed to MQTT topic: ${MQTT_TOPIC}`));
      }
    });
  });

  mqttClient.on('message', (topic: string, message: Buffer) => {
    if (topic === MQTT_TOPIC) {
      log.info(chalk.yellow(`Received MQTT trigger: ${message.toString()}`));
      eventEmitter.emit('syncNow');
    }
  });

  mqttClient.on('error', (err) => {
    log.error(chalk.red(`MQTT error: ${err.message}`));
  });
}

//Main
(async () => {
  do {
    // Initial Sync on startup
    await Sync.perform(config, { log });

    if (!config.runOnce) {
      log.info(chalk.dim(`Waiting ${config.intervalMinutes} minutes...`));
    // Wait for timer to pop or MQTT event to be received
    await Promise.race([
    sleep(config.intervalMinutes * 60 * 1000), //wait for interval
    MQTT_BROKER_URL ? new Promise(resolve => eventEmitter.once('syncNow', resolve)) : Promise.resolve(),
    ]);}
} while (!config.runOnce);


//Cleanup 
if (mqttClient) {
	mqttClient.end();
}
})();
