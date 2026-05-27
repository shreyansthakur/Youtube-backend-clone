//one way of creataing a wrapper function 

// const asynHandler = (fn) => {async(req, res, next) => {
//     try {
        
//     } catch (error) {
        
//     }
// }}

//another way

const asyncHandler = (requestHandler) => {
    return (req, res, next ) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => {next(err)})
    }
}
export {asyncHandler};