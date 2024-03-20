import Container from "../Container";

export const ChatContent = () => {
  let isSent = true;

  return (
    <>
      <Container>
        <section className="flex flex-col gap-4 max-h-[67vh] md:max-h-[65vh] overflow-y-scroll px-10 py-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`border rounded-3xl p-3 break-words flex flex-col flex-wrap gap-2 ${
                isSent ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="border-b">
                <h3 className="text-sm font-semibold">John</h3>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Hello how are you what is your opinion
                </p>
              </div>
              <div className="ml-auto">
                <span className="text-xs">10:30 am</span>
              </div>
            </div>
          ))}
        </section>
      </Container>
    </>
  );
};
