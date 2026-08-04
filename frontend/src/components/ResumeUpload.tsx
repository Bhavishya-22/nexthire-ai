import axios from "axios";


function ResumeUpload(){


async function upload(e:any){

const file=e.target.files[0];


const formData=new FormData();

formData.append(
"file",
file
);



const response=
await axios.post(
"http://localhost:8000/resume/upload",
formData
);


console.log(response.data);

}



return(

<div>

<h2>
Upload Resume
</h2>


<input
type="file"
onChange={upload}
/>


</div>


)

}


export default ResumeUpload;