export interface InvitationMethods {
  invite(
    request: any,
    email: string,
    redirect: string,
    preset?: { [type: string]: any },
    overwrite?: boolean
  ): Promise<any>
}
