export type StudentResponce = {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  grade: string;
  class_letter: string;
  id: string;
};

export type CardProps = {
  name: string;
  grade: string;
};

export interface StudentForm {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  grade: string;
  class_letter: string;
}

export interface NotifyPayload {
  subject: string;
  message: string;
}
