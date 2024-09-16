const dgram = require('node:dgram');
const dnsPacket = require('dns-packet');
const server = dgram.createSocket('udp4');

const dataBase = {
    'piyushgarg.dev': {
        type: 'A',
        data: '1.2.3.4'
    },
    'blog.piyushgarg.dev': {
        type: 'CNAME',
        data: 'starnode.network'
    },
};

server.on('message', (msg, rinfo) => {
    const request = dnsPacket.decode(msg);
    const ipFromDb = dataBase[request.questions[0].name];
    if (ipFromDb) {
        const response = dnsPacket.encode({
            type: 'response',
            id: request.id,
            flags: dnsPacket.AUTHORITATIVE_ANSWER,
            questions: request.questions,
            answers: [{
                type: ipFromDb.type,
                class: "IN",
                name: request.questions[0].name,
                data: ipFromDb.data
            }]
        });
        server.send(response, rinfo.port, rinfo.address);
        console.log(ipFromDb);
    } else {
        const response = dnsPacket.encode({
            type: 'response',
            id: request.id,
            flags: dnsPacket.AUTHORITATIVE_ANSWER | dnsPacket.NXDOMAIN,
            questions: request.questions
        });
        server.send(response, rinfo.port, rinfo.address);
        console.log(`No record found for ${request.questions[0].name}, sent NXDOMAIN.`);
    }
});

server.bind(53, () => console.log('DNS server is running on port 53'));

// When we host this on some machine like AWS and someone wants to use this DNS server,
// we can use some domain like ns.myDnsServer.com and that user put its NS record on ns.myDnsServer.com
// then this server will be handling all the requests.
