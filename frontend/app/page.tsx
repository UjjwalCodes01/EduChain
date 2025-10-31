"client";
import Threads from "../components/Threads";

export default function Home() {
    return (
        <div style={{ width: "100%", position: "relative" }} className="h-screen bg-black">
            <Threads amplitude={1.5} distance={0} enableMouseInteraction={false} />
        </div>
    );
}
