import { esConnect } from "@repo/addresskit-client/elasticsearch";
declare global {
    var esClient: Awaited<ReturnType<typeof esConnect>>;
}
//# sourceMappingURL=server2.d.ts.map