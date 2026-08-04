
def calculate_cri(
resume,
skills,
projects
):


    score=0


    score+=resume
    score+=skills
    score+=projects


    return {

        "CRI":score

    }
