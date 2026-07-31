const { spawn } = require('child_process');

const server = spawn('node', ['packages/mcp/dist/entry.js'], { cwd: __dirname });

let msgId = 0;
function send(method, params) {
    const msg = { jsonrpc: "2.0", id: ++msgId, method, params };
    server.stdin.write(JSON.stringify(msg) + "\n");
}

let buffer = "";
let resolveMap = {};

function callMcp(method, params) {
    return new Promise((resolve) => {
        msgId++;
        const currentId = msgId;
        resolveMap[currentId] = resolve;
        const msg = { jsonrpc: "2.0", id: currentId, method, params };
        server.stdin.write(JSON.stringify(msg) + "\n");
    });
}

server.stdout.on('data', d => {
    buffer += d.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const msg = JSON.parse(line);
            if (msg.id && resolveMap[msg.id]) {
                if (msg.error) {
                    console.error('MCP Error:', msg.error);
                    resolveMap[msg.id](null);
                } else {
                    resolveMap[msg.id](msg.result);
                }
                delete resolveMap[msg.id];
            }
        } catch(e) {}
    }
});

async function runTest() {
    console.log("1. Initializing MCP Server...");
    await callMcp("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" }
    });
    server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

    const courseId = "12977120";

    console.log("\n2. Fetching Class List (loilonote://courses/12977120/users)...");
    const usersRes = await callMcp("resources/read", { uri: `loilonote://courses/${courseId}/users` });
    const users = JSON.parse(usersRes.contents[0].text);
    console.log(`=> Found ${users.length} anonymized students. Sample:`, users.slice(0,2));

    console.log("\n3. Fetching Submissions (loilonote://courses/12977120/submissions)...");
    const subRes = await callMcp("resources/read", { uri: `loilonote://courses/${courseId}/submissions` });
    const submissionsData = JSON.parse(subRes.contents[0].text);
    // 假設 submissionsData 是一個陣列，或者包含 document_groups
    console.log(`=> Found submissions data keys:`, Object.keys(submissionsData));
    
    // 我們直接嘗試為第一位學生隨便指定一個 mock noteId 來測試 Prompt 生成是否正常
    const mockNoteId = "1234567"; // 這可能找不到筆記，但 Prompt 內部會處理
    const student = users[0];
    console.log(`\n4. Simulating Batch Processing... generating prompt for ${student.anonymized_name}`);
    const promptRes = await callMcp("prompts/get", {
        name: "loilonote_review_submission",
        arguments: { courseId: courseId, noteId: mockNoteId }
    });

    console.log(`\n=== Generated Prompt for ${student.anonymized_name} ===`);
    console.log(promptRes.messages[0].content.text.substring(0, 300) + '...\n==================================\n');

    console.log("Test completed successfully!");
    server.kill();
}

runTest().catch(e => {
    console.error(e);
    server.kill();
});
