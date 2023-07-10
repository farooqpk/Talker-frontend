export const ChatContent = () => {
  const a = [
    1, 2, 2, 3, 32, 3, 3, 3, 3, 33, 3, 3, 3, 3, 3, 33, 39, 3, 3, 3, 34, 4, 4, 4,
    4, 4, 4, 4, 3, 3, 4, 3, 43, 4, 3, 43, 1, 2, 2, 3, 32, 3, 3, 3, 3, 33, 3, 3, 3, 3, 3, 33, 39, 3, 3, 3, 34, 4, 4, 4,
    4, 4, 4, 4, 3, 3, 4, 3, 43, 4, 3, 43
  ];
  return (
    <>
      <div className=" text-white h-full md:w-[70%] break-all">
       
       {a.map((item)=>{
        return (
          <p>{item}</p>
        )
       })}
      
      </div>
    </>
  );
};
