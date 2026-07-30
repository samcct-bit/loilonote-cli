import fetch, { FormData, Blob } from 'node-fetch';
import fs from 'node:fs';
import { LoilonoteClient } from './packages/core/dist/client.js';
import { loadConfig } from './packages/core/dist/config.js';

const client = new LoilonoteClient();
const config = loadConfig();
client.setToken(config.auth.token);

const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const { id: dummyId } = await client.uploadGenericFile(dummyPng, '.png');

const formData = new FormData();
formData.append('data', new Blob([fs.readFileSync('packages/core/package.json')]), 'note.zip');
formData.append('thumbnails', JSON.stringify([{ index: 0, small: dummyId, medium: dummyId }]));
formData.append('auth_token', config.auth.token);
fetch('https://n.loilo.tv/api/courses/15020911/submissions/2/v2', {method:'POST', body:formData}).then(r=>r.text()).then(console.log);
